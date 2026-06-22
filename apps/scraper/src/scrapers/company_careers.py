"""
公司官网爬虫 — Tier 1 合规优先

使用 Scrapling Fetcher（快速 HTTP + TLS 指纹伪装）
适合：公司官网 careers 页面（公开信息）
"""

from typing import Any

from scrapling import Fetcher

from src.scrapers.base import BaseScraper, ScraperResult


class CompanyCareersScraper(BaseScraper):
    """公司官网 careers 页面爬虫"""

    SOURCE_NAME = "company_website"
    RATE_LIMIT_PER_MINUTE = 30  # 公司官网一般比较宽松

    async def scrape(self, company_name: str, **kwargs: Any) -> list[ScraperResult]:
        """
        爬取公司 careers 页面

        策略：
        1. 用常见 URL 模板尝试（如 /careers, /jobs, /join）
        2. 用搜索 API 找到正确 URL
        3. 提取岗位列表
        """
        results: list[ScraperResult] = []

        # Step 1: 尝试常见 URL 模板
        candidate_urls = self._build_candidate_urls(company_name)

        for url in candidate_urls:
            try:
                page = Fetcher.get(url, stealthy_headers=True)
                page.status  # 触发请求

                if page.status == 200:
                    # 提取岗位
                    jobs = self._extract_jobs_from_page(page, url, company_name)
                    if jobs:
                        results.extend(jobs)
                        break  # 找到就停止
            except Exception as e:
                self.logger.debug(f"URL {url} failed: {e}")
                continue

        return results

    def _build_candidate_urls(self, company_name: str) -> list[str]:
        """构建候选 URL 列表"""
        # 简单的 URL 模板（生产环境应使用 Exa/Tavily 智能搜索）
        domain_guess = company_name.lower().replace(" ", "").replace("公司", "")
        return [
            f"https://{domain_guess}.com/careers",
            f"https://{domain_guess}.com/jobs",
            f"https://www.{domain_guess}.com/about/careers",
            f"https://careers.{domain_guess}.com",
            f"https://jobs.{domain_guess}.com",
        ]

    def _extract_jobs_from_page(
        self, page: Any, url: str, company: str
    ) -> list[ScraperResult]:
        """从页面提取岗位列表"""
        results: list[ScraperResult] = []

        try:
            # 常见的选择器（简化处理，生产环境应使用 Scrapling 的智能选择器）
            job_selectors = [
                "div.job-listing",
                "div.careers-list > div",
                "ul.jobs > li",
                "div[class*='job']",
            ]

            for selector in job_selectors:
                elements = page.css(selector)
                if elements:
                    for elem in elements[:50]:  # 限制数量
                        try:
                            title = elem.css("h3::text, h2::text, .title::text").get()
                            location = elem.css(".location::text, .place::text").get()
                            link = elem.css("a::attr(href)").get()

                            if title:
                                results.append(
                                    ScraperResult(
                                        source=self.SOURCE_NAME,
                                        company=company,
                                        title=title.strip(),
                                        location=location.strip() if location else "",
                                        url=self._absolutize_url(url, link),
                                        description="",  # 详情页另爬
                                        raw_data={"html": str(elem)[:1000]},
                                    )
                                )
                        except Exception:
                            continue
                    break  # 找到有效选择器后停止
        except Exception as e:
            self.logger.warning(f"提取岗位失败 {url}: {e}")

        return results

    def _absolutize_url(self, base: str, link: str | None) -> str:
        """将相对 URL 转为绝对 URL"""
        if not link:
            return base
        if link.startswith("http"):
            return link
        if link.startswith("/"):
            from urllib.parse import urlparse

            parsed = urlparse(base)
            return f"{parsed.scheme}://{parsed.netloc}{link}"
        return f"{base.rstrip('/')}/{link}"
