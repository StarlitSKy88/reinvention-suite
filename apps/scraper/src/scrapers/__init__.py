"""
Scrapers module - 所有爬虫实现

包含：
- BaseScraper（基类，含熔断、限流）
- CompanyCareersScraper（公司官网，Tier 1）
- GovProcurementScraper（中国政府采购网 — To-G 机会发现）
- HRSSBulletinScraper（人社局公告 — To-G 机会发现）
- OpportunityScorer（To-G 机会评分）

Tier 2 爬虫（Boss/拉勾/猎聘）— 留作后续实现
"""

from src.scrapers.base import BaseScraper, ScraperResult
from src.scrapers.company_careers import CompanyCareersScraper
from src.scrapers.gov_procurement import GovProcurementScraper
from src.scrapers.hrss_bulletin import HRSSBulletinScraper
from src.scrapers.opportunity_scorer import OpportunityScorer, scorer

# Tier 2 爬虫（用户授权）— 留作后续实现
# from src.scrapers.boss_zhipin import BossZhipinScraper
# from src.scrapers.lagou import LagouScraper
# from src.scrapers.liepin import LiepinScraper
# from src.scrapers.linkedin import LinkedInScraper

__all__ = [
    "BaseScraper",
    "ScraperResult",
    "CompanyCareersScraper",
    "GovProcurementScraper",
    "HRSSBulletinScraper",
    "OpportunityScorer",
    "scorer",
]
