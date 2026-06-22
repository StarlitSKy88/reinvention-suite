"""
人社局公告爬虫 — 各地人社局官网

数据源：各省/市人社局官网
目标：发现"再就业服务"、"稳就业"等政策动态和项目机会
"""

import structlog
from scrapling import Fetcher
from typing import Any

from src.scrapers.base import BaseScraper, ScraperResult

logger = structlog.get_logger("scraper.hrss_bulletin")


class HRSSBulletinScraper(BaseScraper):
    """人社局公告爬虫"""

    SOURCE_NAME = "hrss_bulletin"
    RATE_LIMIT_PER_MINUTE = 15

    # 主要省/市人社局官网 URL（示例）
    HRSS_SITES = {
        "北京市": "http://rsj.beijing.gov.cn/",
        "上海市": "https://rsj.sh.gov.cn/",
        "广东省": "http://hrss.gd.gov.cn/",
        "江苏省": "http://jshrss.jiangsu.gov.cn/",
        "浙江省": "https://jst.zj.gov.cn/",
        "四川省": "http://rst.sc.gov.cn/",
        "山东省": "http://hrss.shandong.gov.cn/",
        "湖北省": "http://rst.hubei.gov.cn/",
        "河南省": "http://hrss.henan.gov.cn/",
        "陕西省": "http://rst.shaanxi.gov.cn/",
    }

    async def scrape(self, region: str = None, **kwargs: Any) -> list[ScraperResult]:
        """
        爬取指定地区人社局公告

        Args:
            region: 地区名（如 "北京市"），None = 全部
        """
        results: list[ScraperResult] = []

        sites_to_crawl = (
            {region: self.HRSS_SITES[region]}
            if region and region in self.HRSS_SITES
            else self.HRSS_SITES
        )

        for region_name, base_url in sites_to_crawl.items():
            try:
                region_results = await self._scrape_region(region_name, base_url)
                results.extend(region_results)
                logger.info(
                    "region_scraped",
                    region=region_name,
                    count=len(region_results),
                )
            except Exception as e:
                logger.error(
                    "region_scrape_failed",
                    region=region_name,
                    error=str(e),
                )

        return results

    async def _scrape_region(
        self, region: str, base_url: str
    ) -> list[ScraperResult]:
        """爬取单个地区"""
        results: list[ScraperResult] = []

        # 典型人社局公告路径
        bulletin_paths = [
            "/zwgk/zfxxgkml/bmxxgkml/",  # 政府信息公开目录
            "/zxfg/querenzhudong/",       # 政策文件
            "/zxhd/",                     # 最新活动
            "/tzgg/",                     # 通知公告
        ]

        for path in bulletin_paths:
            url = base_url.rstrip("/") + path
            try:
                page = Fetcher.get(url, stealthy_headers=True)
                if page.status != 200:
                    continue

                # 提取公告
                bulletins = self._extract_bulletins(page, region, url)
                results.extend(bulletins)

            except Exception:
                continue

        return results

    def _extract_bulletins(
        self, page: Any, region: str, base_url: str
    ) -> list[ScraperResult]:
        """提取公告"""
        results: list[ScraperResult] = []

        # 关键词过滤
        keywords = ["再就业", "稳就业", "失业", "35岁", "招聘", "求职", "培训"]

        try:
            # 常见的公告列表选择器
            items = page.css(
                "li a, .list-item a, .news-item a, "
                ".article-item a, table a"
            )

            for item in items[:50]:
                title = item.css("::text").get()
                href = item.css("::attr(href)").get()

                if not title or not any(kw in title for kw in keywords):
                    continue

                full_url = self._absolutize_url(base_url, href)

                results.append(
                    ScraperResult(
                        source=self.SOURCE_NAME,
                        company=f"{region}人社局",
                        title=title.strip(),
                        location=region,
                        url=full_url,
                        description="",
                        keywords=[kw for kw in keywords if kw in title],
                    )
                )

        except Exception:
            pass

        return results

    def _absolutize_url(self, base: str, link: str | None) -> str:
        """转绝对 URL"""
        if not link:
            return base
        if link.startswith("http"):
            return link
        if link.startswith("/"):
            from urllib.parse import urlparse
            parsed = urlparse(base)
            return f"{parsed.scheme}://{parsed.netloc}{link}"
        return f"{base.rstrip('/')}/{link}"
