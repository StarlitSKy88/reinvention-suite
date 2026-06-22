# 再出发 (Reinvention Suite)

> **35+ 失业群体再就业免费助手** —— To-G（政府采购）路线

帮助 35+ 失业群体**全网找到匹配企业**，并**主动协助弥补能力差距**。

## 🎯 核心定位

```
┌─────────────────────────────────────────────┐
│  C 端：完全免费（35+ 失业群体）              │
│  B 端：政府采购（人社局再就业服务）          │
│  核心：全网匹配 + 真实项目孵化 + 政府可信     │
└─────────────────────────────────────────────┘
```

## 🏛️ 架构

```
┌─────────────────────────────────────────────────────────────┐
│  apps/web           Next.js 14 主应用（TypeScript）         │
│  apps/scraper       Python FastAPI + Scrapling 爬虫微服务    │
│  packages/ui        共享 React 组件库                       │
│  packages/types     共享 TypeScript 类型                    │
│  packages/prompts   Prompt 模板版本化                       │
│  packages/database  Prisma schema 共享                      │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ 技术栈

| 层级 | 选型 |
|---|---|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind + Shadcn/ui |
| State | Zustand + Dexie.js (IndexedDB) |
| Backend | Next.js API Routes + Python FastAPI (Scraper) |
| AI | MiniMax-M3（主） / Claude Sonnet 4.6（高质量） / DeepSeek-V3（兜底） |
| Database | PostgreSQL + Redis + Prisma |
| Scraper | Scrapling（Python）+ Playwright + Camoufox |
| Auth | NextAuth + 微信登录 |
| Deploy | Vercel + Railway + Docker |

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18.17
- pnpm ≥ 8.0
- Python ≥ 3.10
- Docker（可选，用于 Scraper 微服务）

### 安装

```bash
# 安装依赖
pnpm install

# 复制环境变量
cp .env.example .env
# 编辑 .env 填入 API keys

# 启动开发
pnpm dev
```

### 访问

- Web 应用：http://localhost:3000
- Scraper API：http://localhost:8000/docs

## 📋 项目状态

| 模块 | 状态 |
|---|---|
| 项目骨架 | ✅ 已初始化 |
| AI Provider 抽象层 | ⏳ 进行中 |
| 简历解析 + PII 脱敏 | ⏳ 进行中 |
| 反幻觉改写 | ⏳ 进行中 |
| 数据采集层（Scrapling） | ⏳ 进行中 |
| 岗位匹配引擎 | 📅 待开始 |
| 项目孵化器 | 📅 待开始 |
| 投递导航 | 📅 待开始 |
| 政府数据看板 | 📅 待开始 |

## 📄 License

UNLICENSED — 私人项目
