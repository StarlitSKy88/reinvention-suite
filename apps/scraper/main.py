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

# ─── 日志配置 ────────────────────────────────────────────────────────────────
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(20),  # INFO
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger("reinvention.scraper")


# ─── 应用生命周期 ────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """应用启动/关闭钩子"""
    logger.info("scraper_service_starting")
    # 初始化 ScraperManager
    app.state.scraper_manager = ScraperManager()
    yield
    logger.info("scraper_service_stopping")


# ─── Pydantic 模型 ───────────────────────────────────────────────────────────


class ScrapeRequest(BaseModel):
    company_name: str
    job_title: str | None = None
    sources: list[str] | None = None


class ScrapeResponse(BaseModel):
    success: bool
    total: int
    jobs: list[dict] = []


# ─── 爬虫路由 ────────────────────────────────────────────────────────────────


@app.post("/api/v1/scrape/company-careers", response_model=ScrapeResponse)
async def scrape_company_careers(
    request: ScrapeRequest,
) -> ScrapeResponse:
    """
    Tier 1: 爬取公司官网 careers 页面
    """
    manager: ScraperManager = app.state.scraper_manager

    try:
        jobs = await manager.collect_jobs(
            company_name=request.company_name,
            sources=["company_website"],
        )
        return ScrapeResponse(
            success=True,
            total=len(jobs),
            jobs=[job.to_dict() for job in jobs],
        )
    except Exception as e:
        logger.error("scrape_failed", error=str(e))
        return ScrapeResponse(success=False, total=0, jobs=[])


@app.post("/api/v1/scrape/multi-source", response_model=ScrapeResponse)
async def scrape_multi_source(request: ScrapeRequest) -> ScrapeResponse:
    """
    多源采集（Tier 1 + Tier 2）
    注意：Tier 2 需要用户授权
    """
    manager: ScraperManager = app.state.scraper_manager

    try:
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


# ─── FastAPI 应用 ────────────────────────────────────────────────────────────
app = FastAPI(
    title="Reinvention Scraper Service",
    description="35+ 再就业助手 — 数据采集微服务（基于 Scrapling）",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js 开发环境
        "https://reinvention.cn",  # 生产环境
        "https://*.reinvention.cn",  # 子域名
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── 健康检查 ────────────────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    version: str
    scrapling_available: bool


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check() -> HealthResponse:
    """健康检查端点"""
    scrapling_available = False
    try:
        import scrapling  # noqa: F401

        scrapling_available = True
    except ImportError:
        pass

    return HealthResponse(
        status="ok",
        version="0.1.0",
        scrapling_available=scrapling_available,
    )


@app.get("/", tags=["health"])
async def root() -> dict[str, str]:
    """根路径"""
    return {
        "service": "reinvention-scraper",
        "version": "0.1.0",
        "docs": "/docs",
    }


# ─── 爬虫路由占位（待 Task #24 完整实现）─────────────────────────────────────


@app.post("/api/v1/scrape/company-careers", tags=["scrapers"])
async def scrape_company_careers(company_name: str) -> dict:
    """
    Tier 1: 爬取公司官网 careers 页面
    使用 Scrapling Fetcher（快速 HTTP）
    """
    # TODO: 实现 (Task #24)
    return {
        "status": "pending",
        "message": "Task #24 待实现",
        "company": company_name,
    }


@app.post("/api/v1/scrape/boss-zhipin", tags=["scrapers"])
async def scrape_boss_zhipin(user_id: str, query: str) -> dict:
    """
    Tier 2: 用户授权爬取 Boss 直聘
    使用 Scrapling StealthyFetcher（反爬）
    """
    # TODO: 实现（Task #19 后续工作）
    return {
        "status": "pending",
        "message": "Boss 直聘爬虫待集成（Tier 2，需要用户授权）",
        "user_id": user_id,
        "query": query,
    }


@app.post("/api/v1/scrape/lagou", tags=["scrapers"])
async def scrape_lagou(user_id: str, query: str) -> dict:
    """Tier 2: 用户授权爬取拉勾"""
    # TODO: 实现
    return {
        "status": "pending",
        "message": "拉勾爬虫待集成（Tier 2，需要用户授权）",
    }


@app.post("/api/v1/scrape/liepin", tags=["scrapers"])
async def scrape_liepin(user_id: str, query: str) -> dict:
    """Tier 2: 用户授权爬取猎聘"""
    # TODO: 实现
    return {
        "status": "pending",
        "message": "猎聘爬虫待集成（Tier 2，需要用户授权）",
    }


@app.post("/api/v1/scrape/linkedin-jobs", tags=["scrapers"])
async def scrape_linkedin_jobs(query: str, location: str) -> dict:
    """Tier 1: 爬取 LinkedIn Jobs"""
    # TODO: 实现
    return {
        "status": "pending",
        "message": "LinkedIn Jobs 爬虫待集成（Tier 1）",
    }


# ─── MCP Server 端点（让 MiniMax-M3 直接调用）───────────────────────────────


@app.post("/api/v1/mcp/tools", tags=["mcp"])
async def mcp_list_tools() -> dict:
    """
    MCP Server 端点 — 让 MiniMax-M3 Agent 直接发现可用爬虫工具
    """
    return {
        "tools": [
            {
                "name": "scrape_company_careers",
                "description": "爬取指定公司的官方招聘页面",
                "parameters": {
                    "company_name": {"type": "string", "required": True},
                },
            },
            {
                "name": "scrape_boss_zhipin",
                "description": "爬取 Boss 直聘（用户授权）",
                "parameters": {
                    "user_id": {"type": "string", "required": True},
                    "query": {"type": "string", "required": True},
                },
            },
            {
                "name": "scrape_lagou",
                "description": "爬取拉勾（用户授权）",
                "parameters": {
                    "user_id": {"type": "string", "required": True},
                    "query": {"type": "string", "required": True},
                },
            },
        ],
    }


@app.post("/api/v1/mcp/invoke", tags=["mcp"])
async def mcp_invoke(tool_name: str, parameters: dict) -> dict:
    """MCP Server — 调用工具"""
    # TODO: 实现 (Task #24)
    return {
        "status": "pending",
        "tool": tool_name,
        "parameters": parameters,
    }


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
