"""
Scrapers module - 所有爬虫实现

包含：
- BaseScraper（基类，含熔断、限流）
- CompanyCareersScraper（公司官网，Tier 1）
- BossZhipinScraper（Boss 直聘，Tier 2，需要用户授权）
- LagouScraper（拉勾，Tier 2）
- LiepinScraper（猎聘，Tier 2）
- LinkedInScraper（LinkedIn Jobs，Tier 1）
"""

from src.scrapers.base import BaseScraper, ScraperResult
from src.scrapers.company_careers import CompanyCareersScraper

# Tier 2 爬虫（用户授权）— 留作后续实现
# from src.scrapers.boss_zhipin import BossZhipinScraper
# from src.scrapers.lagou import LagouScraper
# from src.scrapers.liepin import LiepinScraper
# from src.scrapers.linkedin import LinkedInScraper

__all__ = [
    "BaseScraper",
    "ScraperResult",
    "CompanyCareersScraper",
]
