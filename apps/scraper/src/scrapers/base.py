"""
爬虫基类 - 抽象层

所有具体爬虫继承此类，实现统一的接口和行为：
- 速率限制
- 自动重试
- 错误处理
- 数据标准化
"""

import asyncio
import time
from abc import ABC, abstractmethod
from typing import Any

import structlog


class ScraperResult:
    """标准化爬取结果"""

    def __init__(
        self,
        source: str,
        company: str,
        title: str,
        location: str = "",
        url: str = "",
        description: str = "",
        salary_min: int | None = None,
        salary_max: int | None = None,
        keywords: list[str] | None = None,
        raw_data: dict[str, Any] | None = None,
    ):
        self.source = source
        self.company = company
        self.title = title
        self.location = location
        self.url = url
        self.description = description
        self.salary_min = salary_min
        self.salary_max = salary_max
        self.keywords = keywords or []
        self.raw_data = raw_data or {}

    def to_dict(self) -> dict[str, Any]:
        return {
            "source": self.source,
            "company": self.company,
            "title": self.title,
            "location": self.location,
            "url": self.url,
            "description": self.description,
            "salaryMin": self.salary_min,
            "salaryMax": self.salary_max,
            "keywords": self.keywords,
        }


class BaseScraper(ABC):
    """爬虫基类"""

    SOURCE_NAME: str = "unknown"
    RATE_LIMIT_PER_MINUTE: int = 30
    MAX_RETRIES: int = 3
    TIMEOUT_SECONDS: int = 30

    def __init__(self):
        self.logger = structlog.get_logger(f"scraper.{self.SOURCE_NAME}")
        self._last_request_time = 0.0
        self._failure_count = 0
        self._circuit_breaker_open = False
        self._circuit_breaker_opened_at = 0.0

    async def _rate_limit(self) -> None:
        """速率限制（每分钟 N 次）"""
        interval = 60.0 / self.RATE_LIMIT_PER_MINUTE
        elapsed = time.time() - self._last_request_time
        if elapsed < interval:
            await asyncio.sleep(interval - elapsed)
        self._last_request_time = time.time()

    def _check_circuit_breaker(self) -> bool:
        """
        检查熔断器

        如果熔断器打开，30 秒后自动尝试恢复
        """
        if not self._circuit_breaker_open:
            return True

        # 30 秒冷却后尝试恢复
        if time.time() - self._circuit_breaker_opened_at > 30:
            self.logger.info("circuit_breaker_recovering")
            self._circuit_breaker_open = False
            self._failure_count = 0
            return True

        return False

    def _on_success(self) -> None:
        """成功时重置熔断计数器"""
        self._failure_count = 0

    def _on_failure(self) -> None:
        """失败时累加，触发熔断"""
        self._failure_count += 1
        if self._failure_count >= 5:
            self.logger.warning(
                "circuit_breaker_open",
                failure_count=self._failure_count,
            )
            self._circuit_breaker_open = True
            self._circuit_breaker_opened_at = time.time()

    @abstractmethod
    async def scrape(self, *args: Any, **kwargs: Any) -> list[ScraperResult]:
        """爬取主方法（子类必须实现）"""
        raise NotImplementedError
