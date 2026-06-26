# Reinvention Scraper Service — Dockerfile
# 多阶段构建，最小化镜像体积

FROM python:3.12-slim AS base

# 系统依赖（Playwright 需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libffi-dev \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    fonts-noto-cjk \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Poetry / uv 安装（用 uv 更轻量）
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# 复制依赖文件
COPY pyproject.toml uv.lock* ./

# 安装依赖
RUN uv sync --frozen --no-dev

# 复制源码
COPY . .

# 安装 Playwright 浏览器
RUN uv run playwright install --with-deps chromium

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

EXPOSE 8000

# 启动命令
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
