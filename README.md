# 再出发 Reinvention Suite

**从 0 到 500 万 AI 诊断** — 黑底白字红字点缀
纯 Next.js 14 全栈应用（前端 + 后端 API + 数据库）

## 🚀 快速开始

```bash
cd apps/web
pnpm install
pnpm dev
# → http://localhost:3000/diagnose
```

## 🛠 技术栈（纯 Next.js 14）

- **前端**：Next.js 14 App Router + TypeScript + Tailwind
- **后端**：Next.js API Routes（15+ 端点）
- **数据库**：Prisma + PostgreSQL（兼容 SQLite/D1）
- **AI**：MiniMax-M3 / Claude / DeepSeek
- **部署**：EdgeOne Pages（永久免费，国内快 3-5 倍）

## 📁 项目结构

```
reinvention-suite/
├── apps/
│   └── web/                    # Next.js 14 全栈（含前端 + 15+ API 路由）
├── packages/                    # 共享（types / prompts / ui）
├── docs/                        # 文档
├── edgeone.json                # 部署配置
└── README.md
```

## 🚀 部署到 EdgeOne Pages（5 分钟）

1. 在 EdgeOne Pages 控制台关联 `StarlitSKy88/reinvention-suite`
2. 框架：Next.js
3. 配置环境变量：`MINIMAX_API_KEY`
4. 部署 → 访问 `/diagnose`

## 📡 API 路由（15+ 端点）

| 方法 | 路径 | 功能 |
|---|---|---|
| POST | `/api/diagnose/start` | 启动多轮 AI 诊断 |
| POST | `/api/diagnose/answer` | 提交答案 + 下一轮 |
| POST | `/api/diagnose/final` | 生成 2000 字方案 |
| POST | `/api/match/jobs` | 真实匹配（DB 数据）|
| GET | `/api/jobs/list` | 岗位列表（DB 数据）|
| POST | `/api/resume/rewrite` | 反幻觉改写 |
| POST | `/api/delivery/path` | 投递路径搜索 |
| GET | `/api/gov/dashboard` | 政府看板 |
| GET | `/api/gov/dashboard/cases` | 标杆案例 |
| GET | `/api/opportunities` | To-G 机会发现 |
| POST | `/api/settings/api-keys` | API Key 管理 |
| POST | `/api/analytics/track` | 行为埋点 |

## 📚 文档

- [产品定位](docs/PRODUCT-VISION.md) — 从 0 到 500 万
- [部署清单](docs/DEPLOY-NOW.md) — EdgeOne 部署步骤
- [数据库设计](docs/DATABASE.md)
- [PR 文档](docs/PRD-v2.md)
