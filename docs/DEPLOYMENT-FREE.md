# 完全免费部署方案（EdgeOne + Cloudflare Workers 全家桶）

> **目标**：永久免费部署整个项目（前端 + 后端 + 数据库 + 文件存储）
> **2026 年 6 月最新方案**

## 🏆 推荐：**腾讯云 EdgeOne Pages + Cloudflare Workers 全家桶**

### 总成本：**$0/月**（永久免费）

---

## 📊 Cloudflare Workers 免费全家桶（2026 最新）

### ✅ Python Workers 正式发布（2025-12-08）

- ✅ **Cloudflare 官方支持 Python Workers 正式版**
- ✅ 一行命令部署 FastAPI：`pywrangler deploy`
- ✅ 10 万请求/天，10ms CPU/调用（完全免费）
- ✅ 冷启动 0ms（比 AWS Lambda 快 2.4 倍）
- ✅ 全球 300+ 边缘节点

### 全家桶免费额度（2026 年 6 月最新版）

| 服务 | 免费额度 | 我们的用途 |
|---|---|---|
| **Workers** | 10 万请求/天 | 后端 API + Python 爬虫 |
| **D1** | 5 GB 存储 | 关系型数据库（SQLite 兼容） |
| **R2** | 10 GB 存储，**0 出口流量费** | 简历文件 / 爬虫输出 |
| **KV** | 1 GB 存储 | 缓存 / 会话 |
| **Queues** | 100 万次/月 | 异步任务（爬虫调度）|
| **Cron Triggers** | 每小时一次 | 定时爬虫（To-G 机会发现）|
| **Workers AI** | 10000 Neurons/天 | AI 推理 |
| **Pages** | 无限站点 | 静态网站（备选 EdgeOne）|

> **总成本**：$0/月（永久免费）✅

---

## 🎯 推荐组合

```
┌──────────────────────────────────────────┐
│  腾讯云 EdgeOne Pages（前端 Next.js）      │
│  https://reinvention.edgeone.app          │
│  - 国内节点 3200+（比 Vercel 快 3-5 倍）│
│  - 永久免费                              │
│  - Next.js 完整支持（SSR/SSG/ISR）    │
└──────────────────────────────────────────┘
                    ↓ API 调用
┌──────────────────────────────────────────┐
│  Cloudflare Workers（后端 Python FastAPI）│
│  https://api.reinvention.workers.dev     │
│  - Python Workers 正式版（2025-12）     │
│  - FastAPI 部署                          │
│  - 10 万请求/天 免费                    │
│  - 全球 300+ 边缘节点                   │
└──────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────┐
│  Cloudflare D1（数据库）                │
│  - 5 GB 免费                            │
│  - SQLite 兼容（Prisma 支持）           │
│  - 全球复制 + 边缘读取                  │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  Cloudflare R2（文件存储）              │
│  - 10 GB 免费                            │
│  - 0 出口流量费（最大优势）            │
│  - 用于简历 PDF、爬虫结果              │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  Cloudflare Cron Triggers（定时）        │
│  - 每小时一次                            │
│  - 定时爬 To-G 机会 + 同步政府数据  │
└──────────────────────────────────────────┘
```

---

## 🆚 5 个方案对比

| 方案 | 月成本 | 国内访问 | 永久免费 | 推荐度 |
|---|---|---|---|---|
| **EdgeOne + Cloudflare Workers** | **¥0** | ✅ 快 | ✅ | ⭐⭐⭐⭐⭐ |
| EdgeOne + Dokploy 自托管 | ¥24-50 VPS | ✅ 快 | ✅ | ⭐⭐⭐⭐ |
| Vercel + Railway | $20-50 | ❌ 慢 | ❌ | ⭐⭐ |
| 21YunBox | $200-2000 | ✅ 快 | ❌ 商业贵 | ⭐⭐ |
| Dokploy Cloud | $10 | ⚠️ 海外节点 | ❌ 最低 | ⭐⭐⭐ |

---

## 🚀 部署步骤（推荐方案）

### 1. 后端部署到 Cloudflare Workers

#### A. 安装 CLI

```bash
# 1. 安装 pywrangler（Python Workers 专用）
uv tool install workers-py

# 2. 登录
pywrangler login
```

#### B. 创建 FastAPI 项目

```bash
mkdir api && cd api
pywrangler init --template https://github.com/cloudflare/python-workers-examples/03-fastapi
```

#### C. 写后端代码

```python
# src/main.py
from fastapi import FastAPI
from pydantic import BaseModel
import asgi

app = FastAPI()

# API Key 管理
@app.get("/api/jobs")
async def list_jobs():
    # 从 D1 数据库读取
    return {"jobs": []}

# 改写 API
@app.post("/api/resume/rewrite")
async def rewrite_resume(payload: dict):
    # 调用 LLM（用 AI Gateway 路由到 MiniMax）
    return {"result": "rewritten"}

async def on_fetch(request, env):
    return await asgi.fetch(app, request, env)
```

#### D. 配置 wrangler.jsonc

```jsonc
{
  "name": "reinvention-api",
  "main": "src/main.py",
  "compatibility_date": "2025-12-08",
  
  // D1 数据库
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "reinvention-db",
      "database_id": "xxx"
    }
  ],
  
  // R2 存储
  "r2_buckets": [
    {
      "binding": "STORAGE",
      "bucket_name": "reinvention-files"
    }
  ],
  
  // KV 缓存
  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "xxx"
    }
  ],
  
  // Cron Triggers
  "triggers": {
    "crons": [
      "0 * * * *"  // 每小时一次
    ]
  },
  
  // 环境变量
  "vars": {
    "MINIMAX_BASE_URL": "https://api.MiniMax.chat/v1",
    "ENVIRONMENT": "production"
  }
}
```

#### E. 部署

```bash
pywrangler deploy
# 输出：https://reinvention-api.<your-subdomain>.workers.dev
```

### 2. 数据库：Prisma + D1

#### A. 创建 D1 数据库

```bash
# 1. 登录 Cloudflare Dashboard
# 2. Workers & Pages → D1 → Create database
# 3. 名称：reinvention-db
# 4. 复制 database_id
```

#### B. Prisma 适配 D1

```bash
# 安装 D1 驱动
pnpm add @cloudflare/d1

# 修改 prisma/schema.prisma
datasource db {
  provider = "sqlite"  # D1 兼容 SQLite
  url      = env("DATABASE_URL")
}
```

#### C. 迁移

```bash
cd apps/web

# 导出 Prisma schema 到 D1
npx prisma migrate dev --name init

# 同步到 D1
npx wrangler d1 migrations apply reinvention-db
```

### 3. R2 存储

```bash
# 1. Cloudflare Dashboard → R2 → Create bucket
# 2. 名称：reinvention-files
# 3. 上传文件 API
```

```typescript
// 上传简历 PDF
await env.STORAGE.put(`resumes/${userId}.pdf`, pdfBuffer, {
  httpMetadata: { contentType: 'application/pdf' },
});
```

### 4. 前端部署到 EdgeOne Pages

```bash
# 1. 登录 https://pages.edgeone.ai/zh
# 2. 创建项目 → 关联 GitHub
# 3. 配置：
#    - 框架：Next.js
#    - 构建命令：cd apps/web && pnpm install && pnpm build
#    - 输出目录：apps/web/.next
# 4. 环境变量：
#    - NEXT_PUBLIC_API_URL=https://reinvention-api.workers.dev
# 5. 部署
```

---

## 💰 成本对比

| 方案 | 月成本 | 永久免费 | 实际可用 |
|---|---|---|---|
| **EdgeOne + Cloudflare Workers** | **$0** | ✅ | ✅ 中小项目足够 |
| Vercel Hobby | $0 | ❌（不可商用）| 限个人/学习 |
| Vercel Pro | $20 | ❌ | 强制付费 |
| Railway | $5 | ❌ | $5 后按量计费 |
| 21YunBox | $200+ | ❌ | 商业级 |

**月活 1 万以下**：**$0**（完全免费）✅
**月活 10 万以下**：约 $10-20（Workers Paid）
**月活 100 万**：需要 Cloudflare Workers Paid $5/月

---

## ⚠️ 注意事项

### 1. Python Workers CPU 限制
- 免费版：**10ms CPU/调用**
- 复杂任务（PDF 解析、大模型调用）可能不够
- **解决方案**：用 Queue 异步处理

### 2. D1 限制
- D1 是 SQLite（不是 PostgreSQL）
- 免费 5 GB
- 写性能受限（边缘 SQLite）
- **适合**：MVP、小项目、读多写少

### 3. Workers 限制
- 单 Worker 100k 请求/天
- 内存 128MB
- 无长连接（WebSocket 需 Durable Objects）

### 4. 不适合
- ❌ 复杂关系型数据库（用 D1 简单场景可以）
- ❌ 长时间运行的爬虫（用 Queue 异步）
- ❌ 复杂 WebSocket 实时通信

---

## 🎯 我们项目的最终部署架构

```
┌──────────────────────────────────────┐
│  EdgeOne Pages（前端）                 │
│  https://reinvention.edgeone.app       │
│  - 永久免费                           │
│  - 国内快 3-5 倍                      │
└──────────────────────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  Cloudflare Workers（后端 Python）    │
│  - 10 万请求/天 免费                  │
│  - 10ms CPU/调用                      │
└──────────────────────────────────────┘
       ↓                    ↓
┌──────────────┐    ┌──────────────┐
│  D1 数据库   │    │  R2 文件     │
│  5 GB 免费   │    │  10 GB 免费  │
│  (SQLite)   │    │  0 出口费    │
└──────────────┘    └──────────────┘
       ↓
┌──────────────────────────────────────┐
│  Cron Triggers（每小时）              │
│  定时爬 To-G 机会 + 同步政府数据   │
└──────────────────────────────────────┘
```

**总成本**：$0/月（永久免费）✅

---

## 📚 相关链接

- 腾讯云 EdgeOne Pages：https://pages.edgeone.ai/zh
- Cloudflare Workers Python：https://blog.cloudflare.com/zh-cn/python-workers-advancements/
- Cloudflare Workers 定价：https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare D1 文档：https://developers.cloudflare.com/d1/
- Cloudflare R2 文档：https://developers.cloudflare.com/r2/
- Python Workers 示例：https://github.com/cloudflare/python-workers-examples
- Cloudflare Skills：https://github.com/cloudflare/skills
- 零成本架构（Cloudflare 全家桶）：https://www.cnblogs.com/itech/p/20682608
