"""
爬虫调度器 - 多源融合

输入：公司名 + 岗位名
输出：合并去重后的岗位列表

调度策略：
1. 并发调用所有启用的爬虫
2. 失败自动 fallback
3. 结果去重（基于 title + company）
"""

import asyncio
from typing import Any

import structlog

from src.scrapers.base import ScraperResult
from src.scrapers.company_careers import CompanyCareersScraper

logger = structlog.get_logger("scraper.manager")


class ScraperManager:
    """爬虫调度器"""

    def __init__(self):
        self.scrapers: dict[str, Any] = {
            "company_website": CompanyCareersScraper(),
            # Tier 2 爬虫待集成
            # "boss_zhipin": BossZhipinScraper(),
            # "lagou": LagouScraper(),
            # "liepin": LiepinScraper(),
        }

    async def collect_jobs(
        self,
        company_name: str,
        sources: list[str] | None = None,
    ) -> list[ScraperResult]:
        """
        多源采集岗位

        Args:
            company_name: 公司名
            sources: 指定数据源列表（None = 所有）

        Returns:
            合并去重后的岗位列表
        """
        enabled_sources = sources or list(self.scrapers.keys())

        logger.info(
            "collect_jobs_start",
            company=company_name,
            sources=enabled_sources,
        )

        tasks = []
        for source_name in enabled_sources:
            scraper = self.scrapers.get(source_name)
            if scraper:
                tasks.append(self._safe_scrape(scraper, company_name, source_name))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 合并所有成功的结果
        all_jobs: list[ScraperResult] = []
        for result in results:
            if isinstance(result, list):
                all_jobs.extend(result)
            elif isinstance(result, Exception):
                logger.error("scraper_failed", error=str(result))

        # 去重（基于 company + title）
        deduped = self._dedupe(all_jobs)

        logger.info(
            "collect_jobs_done",
            company=company_name,
            total=len(all_jobs),
            deduped=len(deduped),
        )

        return deduped

    async def _safe_scrape(
        self, scraper: Any, company_name: str, source_name: str
    ) -> list[ScraperResult]:
        """安全调用爬虫（异常隔离）"""
        try:
            return await scraper.scrape(company_name)
        except Exception as e:
            logger.error(
                "scraper_exception",
                source=source_name,
                company=company_name,
                error=str(e),
            )
            return []

    def _dedupe(
        self, jobs: list[ScraperResult]
    ) -> list[ScraperResult]:
        """基于 (company, title) 去重"""
        seen = set()
        deduped = []

        for job in jobs:
            key = (job.company.lower().strip(), job.title.lower().strip())
            if key not in seen and job.title:
                seen.add(key)
                deduped.append(job)

        return deduped
