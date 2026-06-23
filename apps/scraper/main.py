"""
Reinvention Scraper — Python FastAPI 微服务入口

基于 Scrapling 框架，提供：
- Tier 1: 公司官网 + Exa/Tavily 合规爬虫
- Tier 2: 用户授权爬虫（Boss/拉勾/猎聘）
- Tier 3: 高端爬虫（财报、CEO 社媒）

启动：uvicorn main:app --reload --port 8000
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.scrapers.manager import ScraperManager
from src.scrapers.company_careers import CompanyCareersScraper
from src.scrapers.gov_procurement import GovProcurementScraper
from src.scrapers.hrss_bulletin import HRSSBulletinScraper


# ─── 日志配置 ────────────────────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(20),
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger("reinvention.scraper")


# ─── 应用生命周期 ────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """应用启动/关闭钩子"""
    logger.info("scraper_service_starting")
    app.state.scraper_manager = ScraperManager()
    yield
    logger.info("scraper_service_stopping")


# ─── FastAPI 应用 ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="Reinvention Scraper Service",
    description="35+ 再就业助手 — 数据采集微服务（基于 Scrapling）",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3030",
        "https://reinvention.cn",
        "https://*.reinvention.cn",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Pydantic 模型 ───────────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    version: str
    scrapling_available: bool


class ScrapeRequest(BaseModel):
    company_name: str
    job_title: str | None = None
    sources: list[str] | None = None


class ScrapeResponse(BaseModel):
    success: bool
    total: int
    jobs: list[dict] = []


# ─── 健康检查 ────────────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check() -> HealthResponse:
    """健康检查"""
    scrapling_available = False
    try:
        import scrapling  # noqa: F401

        scrapling_available = True
    except ImportError:
        pass

    return HealthResponse(
        status="ok", version="0.1.0", scrapling_available=scrapling_available
    )


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    """根路径"""
    return {
        "service": "reinvention-scraper",
        "version": "0.1.0",
        "docs": "/docs",
    }


# ─── 公司官网爬虫 ────────────────────────────────────────────────────────────
@app.post("/api/v1/scrape/company-careers", response_model=ScrapeResponse)
async def scrape_company_careers(
    request: ScrapeRequest,
) -> ScrapeResponse:
    """Tier 1: 爬取公司官网 careers 页面"""
    try:
        scraper = CompanyCareersScraper()
        results = await scraper.scrape(keyword=request.company_name)
        return ScrapeResponse(
            success=True,
            total=len(results),
            jobs=[job.to_dict() for job in results],
        )
    except Exception as e:
        logger.error("company_careers_failed", error=str(e))
        return ScrapeResponse(success=False, total=0, jobs=[])


# ─── 多源爬虫 ─────────────────────────────────────────────────────────────────
@app.post("/api/v1/scrape/multi-source", response_model=ScrapeResponse)
async def scrape_multi_source(request: ScrapeRequest) -> ScrapeResponse:
    """多源采集（Tier 1 + Tier 2）"""
    try:
        manager = app.state.scraper_manager
        jobs = await manager.collect_jobs(
            company_name=request.company_name,
            sources=request.sources,
        )
        return ScrapeResponse(
            success=True,
            total=len(jobs),
            jobs=[job.to_dict() for job in jobs],
        )
    except Exception as e:
        logger.error("multi_scrape_failed", error=str(e))
        return ScrapeResponse(success=False, total=0, jobs=[])


# ─── To-G 政府采购网 ────────────────────────────────────────────────────────
@app.post("/api/v1/scrape/gov-procurement")
async def scrape_gov_procurement() -> dict:
    """
    To-G 机会发现：中国政府采购网
    关键词：再就业、稳就业、35+、AI 求职
    """
    try:
        scraper = GovProcurementScraper()
        results = await scraper.scrape_all_keywords()
        return {
            "success": True,
            "total": len(results),
            "opportunities": [
                {
                    "source": "ccgp",
                    "title": r.title,
                    "buyer": r.company,
                    "location": r.location,
                    "url": r.url,
                    "budget": r.raw_data.get("budget"),
                    "publish_date": r.raw_data.get("publish_date"),
                }
                for r in results
            ],
        }
    except Exception as e:
        logger.error("gov_procurement_failed", error=str(e))
        return {
            "success": False,
            "total": 0,
            "opportunities": [],
            "error": str(e),
        }


# ─── 人社局公告 ──────────────────────────────────────────────────────────────
@app.post("/api/v1/scrape/hrss-bulletin")
async def scrape_hrss_bulletin(region: str | None = None) -> dict:
    """
    To-G 机会发现：人社局公告
    """
    try:
        scraper = HRSSBulletinScraper()
        results = await scraper.scrape(region=region)
        return {
            "success": True,
            "total": len(results),
            "opportunities": [
                {
                    "source": "hrss_bulletin",
                    "title": r.title,
                    "buyer": r.company,
                    "location": r.location,
                    "url": r.url,
                    "description": r.description,
                }
                for r in results
            ],
        }
    except Exception as e:
        logger.error("hrss_scrape_failed", error=str(e))
        return {
            "success": False,
            "total": 0,
            "opportunities": [],
            "error": str(e),
        }


# ─── Tier 2 占位（用户授权爬虫 — 待后续集成）─────────────────────────────────
@app.post("/api/v1/scrape/boss-zhipin")
async def scrape_boss_zhipin(user_id: str, query: str) -> dict:
    """Tier 2: Boss 直聘（用户授权后启用）"""
    return {
        "status": "pending",
        "message": "Boss 直聘爬虫待集成（需要用户授权）",
        "user_id": user_id,
        "query": query,
    }


@app.post("/api/v1/scrape/lagou")
async def scrape_lagou(user_id: str, query: str) -> dict:
    """Tier 2: 拉勾（用户授权后启用）"""
    return {"status": "pending", "message": "拉勾爬虫待集成"}


@app.post("/api/v1/scrape/liepin")
async def scrape_liepin(user_id: str, query: str) -> dict:
    """Tier 2: 猎聘（用户授权后启用）"""
    return {"status": "pending", "message": "猎聘爬虫待集成"}


@app.post("/api/v1/scrape/linkedin-jobs")
async def scrape_linkedin_jobs(query: str, location: str) -> dict:
    """Tier 1: LinkedIn Jobs"""
    return {"status": "pending", "message": "LinkedIn Jobs 爬虫待集成"}


# ─── MCP Server 端点（让 MiniMax-M3 直接调用）───────────────────────────────
@app.post("/api/v1/mcp/tools", tags=["mcp"])
async def mcp_list_tools() -> dict:
    """MCP Server — 让 MiniMax-M3 Agent 发现可用爬虫工具"""
    return {
        "tools": [
            {
                "name": "scrape_company_careers",
                "description": "爬取指定公司的官方招聘页面",
                "parameters": {"company_name": {"type": "string", "required": True}},
            },
            {
                "name": "scrape_gov_procurement",
                "description": "爬取政府采购网寻找再就业/稳就业机会",
                "parameters": {},
            },
            {
                "name": "scrape_hrss_bulletin",
                "description": "爬取人社局公告",
                "parameters": {"region": {"type": "string", "required": False}},
            },
        ],
    }


@app.post("/api/v1/mcp/invoke", tags=["mcp"])
async def mcp_invoke(tool_name: str, parameters: dict) -> dict:
    """MCP Server — 调用工具"""
    return {"status": "pending", "tool": tool_name, "parameters": parameters}


def run() -> None:
    """CLI 入口"""
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )


if __name__ == "__main__":
    run()
