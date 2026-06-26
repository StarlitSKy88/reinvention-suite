# 再出发 Reinvention Suite

**从 0 到 500 万 AI 诊断** — 黑底白字红字点缀
基于歌鸫真实案例设计的多轮 AI 咨询工具

## 🚀 快速开始

```bash
pnpm install
cd apps/web
pnpm dev
# → http://localhost:3000/diagnose
```

## 🚀 部署到 EdgeOne Pages

1. 在 EdgeOne Pages 控制台关联本仓库
2. 配置：
   - 框架：Next.js
   - 根目录：`/`
   - 输出目录：`.next`
   - 构建命令：`cd apps/web && pnpm install --frozen-lockfile=false && pnpm build`
3. 添加环境变量 `MINIMAX_API_KEY`
4. 部署完成 → 访问 `/diagnose`

## 📁 项目结构

```
apps/
├── web/                # Next.js 14 前端（含 12 个页面、15 个 API 路由）
└── api-go/             # Go + Gin 后端（多轮 AI 诊断）

cloud-functions/      # EdgeOne Cloud Functions Go 函数
docs/                   # 文档（产品定位、部署、PR、To-G 销售）
prompts/                # AI 诊断 prompt（4 轮 13 问）
edgeone.json            # EdgeOne Pages 配置
```

## 📚 文档

- [产品定位](docs/PRODUCT-VISION.md) — 从 0 到 500 万
- [部署清单](docs/DEPLOY-NOW.md) — EdgeOne 部署步骤
- [数据库设计](docs/DATABASE.md)
- [PR 文档](docs/PRD-v2.md)

## 🛠 技术栈

- **前端**：Next.js 14 + TypeScript + Tailwind
- **后端**：Go + Gin（EdgeOne Cloud Functions）
- **AI**：MiniMax-M3 / Claude / DeepSeek
- **部署**：EdgeOne Pages（永久免费，国内快 3-5 倍）
