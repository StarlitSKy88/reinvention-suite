"""
中国政府采购网爬虫 — To-G 项目发现引擎

数据源：http://www.ccgp.gov.cn/
目标：发现"再就业服务"、"AI 求职"、"稳就业"等相关的政府采购项目
"""

import re
from datetime import datetime
from typing import Any

import structlog
from scrapling import Fetcher

from src.scrapers.base import BaseScraper, ScraperResult

logger = structlog.get_logger("scraper.gov_procurement")


class GovProcurementScraper(BaseScraper):
    """中国政府采购网爬虫"""

    SOURCE_NAME = "ccgp"
    RATE_LIMIT_PER_MINUTE = 10  # 政府网站较敏感，限速

    # 关键词（与再出发产品相关的政府采购方向）
    KEYWORDS = [
        "再就业",
        "稳就业",
        "35岁",
        "35岁以上",
        "失业人员",
        "再就业服务",
        "AI求职",
        "人工智能招聘",
        "人力资源服务",
        "就业服务",
        "公共就业服务",
        "招聘平台",
        "就业培训",
        "职业指导",
        "求职",
    ]

    # 政府采购网搜索 URL 模板
    SEARCH_URL = (
        "http://search.ccgp.gov.cn/bxsearch"
        "?searchtype=1"
        "&page_index=1"
        "&bidSort=0"
        "&buyerName=&projectId=&pinMu=0&bidType=0&dbselect=bidx"
        "&kw={keyword}"
        "&start_time={start_time}"
        "&end_time={end_time}"
        "&timeType=6&displayZone=&zoneId="
        "&pppStatus=0&agentName="
    )

    async def scrape(self, keyword: str = "再就业", **kwargs: Any) -> list[ScraperResult]:
        """
        爬取政府采购公告

        Args:
            keyword: 搜索关键词
        Returns:
            标准化结果列表
        """
        results: list[ScraperResult] = []

        # 默认爬最近 30 天
        end_time = datetime.now().strftime("%Y-%m-%d")
        start_time = (datetime.now() - __import__("datetime").timedelta(days=30)).strftime("%Y-%m-%d")

        url = self.SEARCH_URL.format(
            keyword=keyword,
            start_time=start_time,
            end_time=end_time,
        )

        try:
            page = Fetcher.get(url, stealthy_headers=True)
            page.status  # 触发请求

            if page.status != 200:
                logger.warning("gov_procurement_non_200", status=page.status)
                return results

            # 解析公告列表
            announcements = self._extract_announcements(page, keyword)

            for ann in announcements:
                results.append(
                    ScraperResult(
                        source=self.SOURCE_NAME,
                        company=ann["buyer"],
                        title=ann["title"],
                        location=ann["location"],
                        url=ann["url"],
                        description=ann["summary"],
                        keywords=[keyword] + ann.get("tags", []),
                        raw_data={
                            "publish_date": ann.get("publish_date"),
                            "budget": ann.get("budget"),
                            "deadline": ann.get("deadline"),
                        },
                    )
                )

        except Exception as e:
            logger.error("gov_procurement_scrape_failed", error=str(e))

        return results

    def _extract_announcements(self, page: Any, keyword: str) -> list[dict]:
        """从页面提取公告列表"""
        announcements: list[dict] = []

        try:
            # 中国政府采购网的标准结构
            items = page.css("ul.vT-srch-result-list li, .list-item, .search-result-item")

            for item in items[:50]:  # 限制数量
                try:
                    title_elem = item.css("a::text, .title::text").get()
                    href = item.css("a::attr(href)").get()
                    date = item.css(".date::text, .time::text").get()

                    if not title_elem:
                        continue

                    # 提取金额（如果存在）
                    budget = self._extract_budget(item.text())

                    # 提取地区
                    location = self._extract_location(title_elem)

                    announcements.append({
                        "title": title_elem.strip(),
                        "url": self._absolutize_url("http://www.ccgp.gov.cn/", href),
                        "buyer": self._extract_buyer(item.text()),
                        "publish_date": date.strip() if date else None,
                        "budget": budget,
                        "location": location,
                        "summary": item.text()[:500],
                        "tags": self._extract_tags(item.text()),
                    })

                except Exception:
                    continue

        except Exception as e:
            logger.warning("extract_announcements_failed", error=str(e))

        return announcements

    def _extract_budget(self, text: str) -> str | None:
        """提取预算金额"""
        # 匹配 "¥100万" "100万元" "100W" 等
        patterns = [
            r"[¥￥](\d+(?:\.\d+)?)\s*[万千]",
            r"(\d+(?:\.\d+)?)\s*[万Ww]元",
            r"预算\s*[：:]\s*[¥￥]?(\d+(?:\.\d+)?)\s*[万千]",
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return f"¥{match.group(1)}万"
        return None

    def _extract_location(self, text: str) -> str:
        """提取地区"""
        # 匹配 "XX省XX市" "北京市" "上海市"
        match = re.search(
            r"([一-龥]{2,4}(?:省|自治区|市))",
            text,
        )
        if match:
            return match.group(1)
        return "全国"

    def _extract_buyer(self, text: str) -> str:
        """提取采购方"""
        # 通常格式: "XX人社局" "XX区政府" "XX学校"
        match = re.search(
            r"([一-龥]{2,15}(?:局|办|政府|学校|医院))",
            text,
        )
        if match:
            return match.group(1)
        return "未知"

    def _extract_tags(self, text: str) -> list[str]:
        """提取标签"""
        tags = []
        for kw in self.KEYWORDS:
            if kw in text:
                tags.append(kw)
        return tags

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

    async def scrape_all_keywords(self) -> list[ScraperResult]:
        """爬取所有关键词"""
        all_results: list[ScraperResult] = []
        for keyword in self.KEYWORDS:
            try:
                results = await self.scrape(keyword=keyword)
                all_results.extend(results)
                logger.info("keyword_scraped", keyword=keyword, count=len(results))
            except Exception as e:
                logger.error("keyword_scrape_failed", keyword=keyword, error=str(e))

        # 去重
        seen = set()
        unique = []
        for r in all_results:
            key = (r.company, r.title)
            if key not in seen:
                seen.add(key)
                unique.append(r)

        return unique
