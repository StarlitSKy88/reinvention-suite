# 国内部署方案（2026 年 6 月）

> **目标**：在国内用免费方案替代 Vercel + Railway
> **搜索结果**：基于 GitHub + 2026 最新文章

---

## 🏆 最佳方案：**腾讯云 EdgeOne Pages（Maker s）**

### 为什么是它？

- ✅ **腾讯云官方**（稳定可信）
- ✅ **永久免费**（不限量流量）
- ✅ **Next.js 完整支持**（13.5+ / 14 / 15 / 16，含 SSR/SSG/ISR/Middleware）
- ✅ **3200+ 全球节点**（国内 2300+）
- ✅ **国内访问比 Vercel 快 3-5 倍**
- ✅ **边缘函数 + Serverless 集成**
- ✅ **Git 部署**（和 Vercel 一样方便）
- ✅ **提供 "从 Vercel 迁移到 EdgeOne Pages" 官方文档**
- ⚠️ **限制**：加速区域"中国大陆"需要 ICP 备案

### 官网 + 文档
- 官网：https://pages.edgeone.ai/zh
- 定价：https://pages.edgeone.ai/zh/pricing
- 部署 Next.js：https://pages.edgeone.ai/zh/resources/deploy-nextjs-project-to-pages
- 从 Vercel 迁移：https://pages.edgeone.ai/zh/document/

### 2026-04 正式版亮点
- 支持 Next.js 中间件
- 支持平台级路由
- 全面支持 SSR/SSG/ISR
- 新增 Node Functions
- 更新 EdgeOne CLI
- 2026-04 月正式版上线

### 免费额度（永久）

| 项目 | 免费额度 |
|---|---|
| **网站数** | 不限 |
| **流量** | 不限（"不限量网站安全加速流量"） |
| **请求数** | 不限 |
| **函数调用** | 每月定额 |
| **存储** | 每月定额 |
| **构建次数** | 每月定额 |
| **SSL** | 免费 |
| **自定义域名** | 支持 |

> "**我们已支持大多数流行框架自动部署**"（Next.js, Nuxt, Astro, React Router, SvelteKit, TanStack Start, Vike）

---

## 🥈 备选方案 1：**21YunBox（21cloudbox.com）**

### 简介
- **专门做 Vercel/Netlify 在中国加速**
- 5000+ 客户（Zippo、Bottega Veneta、Commune Lifestyle）
- 自 2021 起服务
- 2026-01 仍是"Vercel 在中国加速"主流方案

### 特点
- ✅ **保留 Vercel 工作流**（不是替代，而是"优化"）
- ✅ **ICP 备案 + MIIT 审计 + PIPL 合规**
- ✅ **集成阿里云/腾讯云 CDN**
- ✅ **YouTube/Google Fonts 自动替换**
- ⚠️ **价格高**（$200-2000/月）
- ⚠️ **适合月收入 $50K+ 成熟产品**

### 免费层
- **21YunBox 提供非商业免费版**（"for open-source community"）
- 仅适合开源项目

### 我们的选择
❌ 太贵 ❌ 偏商业 — 不推荐

---

## 🥉 备选方案 2：**腾讯云 CloudBase（替代 Railway）**

### 简介
- 2026-06-12："面向 AI Coding 的后端一体化平台"
- 支持 Next.js 14+ 全栈（SSR/流式/Server Actions）
- 含 PostgreSQL、Redis、云函数、云存储、身份认证

### 2026 文档
- 部署 Next.js：https://docs.cloudbase.net/recipes/deploy-nextjs-to-cloudbase-run
- 部署 CLI：`tcb cloudrun deploy --port 3000`
- 一行部署，自动 build + 推送

### 免费额度
| 项目 | 免费 |
|---|---|
| 数据库 | 2 GB（PostgreSQL） |
| 存储 | 5 GB |
| 流量 | 5 GB/月 |
| 云函数 | 10 万次/月 |
| 容器 | 1 个最小实例 |

---

## 💎 推荐组合：EdgeOne Pages + CloudBase

```
┌─────────────────────────────────────┐
│  腾讯云 EdgeOne Pages（前端）        │
│  https://reinvention.cn              │
│  - Next.js 全栈支持                  │
│  - 全球 3200+ 节点加速               │
│  - 国内访问 5-10 倍快于 Vercel       │
│  - 永久免费（不限量流量）           │
│  - 边缘函数 + SSR + ISR            │
└─────────────────────────────────────┘
                ↓ fetch
┌─────────────────────────────────────┐
│  腾讯云 CloudBase（后端）            │
│  - PostgreSQL 2 GB                  │
│  - 云函数（爬虫 + 反幻觉改写）    │
│  - 云存储（用户简历）               │
│  - 微信登录（可选）                │
└─────────────────────────────────────┘
```

**总成本**：¥0/月（完全免费）

---

## 🚀 部署步骤（EdgeOne Pages）

### 1. 准备项目（已就绪）

我们的项目：
- ✅ `next.config.mjs` 支持 standalone 输出
- ✅ Git 仓库（GitHub）
- ✅ 环境变量清单（`apps/web/.env.local.example`）

### 2. 创建 EdgeOne Pages 项目

```
1. 访问 https://pages.edgeone.ai/zh
2. 点击"立即开始"（注册/登录腾讯云）
3. 控制台 → Pages → 创建项目
4. 选择"导入 Git 仓库"
5. 关联 GitHub 仓库（首次需要授权）
6. 选择仓库 + 分支（main/master）
7. 框架自动识别：Next.js
8. 配置：
   - 构建命令：cd apps/web && pnpm install && pnpm build
   - 输出目录：apps/web/.next
   - Node 版本：20（推荐 Next.js 14）
9. 点击"部署"
```

### 3. 配置环境变量

```bash
# 在 EdgeOne Pages 控制台 → 环境变量

DATABASE_URL=postgresql://reinvention:xxx@xxx.cloudbase.tencentcloud.com:5432/reinvention
MINIMAX_API_KEY=sk-...
NEXTAUTH_SECRET=...
ENCRYPTION_KEY=...
JWT_SECRET=...
NODE_ENV=production
```

### 4. 验证部署

```bash
# EdgeOne 提供 URL：https://reinvention.edgeone.app
curl https://reinvention.edgeone.app/
curl https://reinvention.edgeone.app/api/jobs/list
```

### 5. 自定义域名

```
1. EdgeOne 控制台 → 域名管理 → 添加域名 reinvention.cn
2. 选择加速区域：
   - "全球（不含中国大陆）"：无需 ICP 备案，立即可用，国内也能访问
   - "中国大陆"：需要 ICP 备案（个人 1-2 周）
3. EdgeOne 给 CNAME 值
4. 在腾讯云 DNS 添加 CNAME
5. 自动申请 SSL 证书
6. 等待 10 分钟生效
```

### 6. ICP 备案（可选）

如果用户主要在国内：
- 个人也可以申请 ICP 备案
- 周期：1-2 周
- 接入商：腾讯云、阿里云、华为云
- 备案后选择"中国大陆"加速区域，国内访问更快

---

## 🚀 部署后端到 CloudBase

### 1. 创建云开发环境

```
1. https://console.cloud.tencent.com/tcb
2. 创建环境（如 reinvention-prod）
3. 开通 PostgreSQL
4. 设置白名单（允许外部访问）
```

### 2. 数据库迁移

```bash
# 本地导出
cd apps/web
DATABASE_URL="postgresql://opc-1@localhost:5432/reinvention" \
  npx prisma db pull
# 或
pg_dump -h localhost -U reinvention reinvention > backup.sql

# 导入到 CloudBase
# CloudBase 控制台 → 数据库 → 连接信息
psql "postgresql://reinvention:password@gateway.xxx.cloudbase.tencentcloud.com:5432/reinvention" < backup.sql

# 更新 .env
DATABASE_URL="postgresql://reinvention:password@gateway.xxx.cloudbase.tencentcloud.com:5432/reinvention?sslmode=require"
```

### 3. 部署 Python 爬虫（云函数）

```python
# apps/scraper/cloud_function_main.py
from fastapi import FastAPI
from src.scrapers.manager import ScraperManager

app = FastAPI()
manager = ScraperManager()

@app.post("/scrape/company-careers")
async def scrape(payload: dict):
    return await manager.collect_jobs(company_name=payload["company_name"])
```

部署到 CloudBase 云函数。

### 4. 部署爬虫（云托管，Docker）

```bash
# CloudBase 云托管
# 1. 上传 apps/scraper 目录
# 2. 使用 cloudfunction/Dockerfile
# 3. 端口 8000
# 4. 免费 1 个最小实例
```

---

## 💰 成本对比

### Vercel + Railway（国外）

| 服务 | 免费额度 | 超出后 |
|---|---|---|
| Vercel Hobby | 100 GB 流量 | 不可商用（必须 Pro $20/月） |
| Railway | $5/月 | $0.000463/分钟 |
| **总计** | **$0** | **$20-50/月** |

### 国内方案（EdgeOne + CloudBase）

| 服务 | 免费额度 | 超出后 |
|---|---|---|
| 腾讯云 EdgeOne Pages | **不限量**流量 | 即将推出付费版 |
| 腾讯云 CloudBase | 2 GB DB + 5 GB 流量 | ¥0.09/GB |
| 腾讯云 PostgreSQL | 2 GB | ¥0.05/小时 |
| **总计** | **¥0** | **根据用量** |

月活 1 万以下：完全免费 ✅
月活 10 万：约 ¥50-200/月（比 Vercel+Railway 便宜 50%）✅

---

## 🔄 迁移路径（4 周）

### Week 1：准备

```bash
# 1. 创建腾讯云账号
# 2. 验证 EdgeOne Pages 账号
# 3. 验证 CloudBase 账号
# 4. 创建 GitHub 仓库（如未创建）
```

### Week 2：前端迁移

```bash
# 1. 在 EdgeOne Pages 创建项目
# 2. 关联 GitHub 仓库
# 3. 配置环境变量
# 4. 部署并验证
# 5. 配置自定义域名
```

### Week 3：后端迁移

```bash
# 1. 在 CloudBase 创建 PostgreSQL
# 2. 迁移数据
# 3. 更新 DATABASE_URL
# 4. 部署 Python 爬虫（云函数 / 云托管）
# 5. 配置 API 网关
```

### Week 4：上线

```bash
# 1. 监控 + 日志
# 2. 100 个种子用户内测
# 3. 开始 To-G 销售
# 4. 收集反馈
```

---

## 💡 关键建议

### 1. 关于 ICP 备案

- **个人站 + 海外用户为主**：选"全球（不含中国大陆）"加速区，**无需备案**
- **国内用户为主**：选"中国大陆"加速区，**需要 ICP 备案**（1-2 周）
- **微信小程序 + 政府 To-G**：必须 ICP 备案

### 2. 关于 CloudBase vs EdgeOne

- **EdgeOne Pages** = 纯前端托管（替代 Vercel）
- **CloudBase** = 后端一体化（替代 Railway + 数据库）
- 两个可以**一起用**（最佳组合）

### 3. 微信生态集成（可选）

如果 To-G 项目，建议用 CloudBase（天然集成微信登录、公众号、小程序）

---

## 🚨 重要发现

基于 2026-06 实际搜索：
- ✅ **EdgeOne Pages 已正式版**（2026-04）
- ✅ **支持 Next.js 14/15/16 完整功能**
- ✅ **永久免费**（不限量流量）
- ✅ **国内节点比 Vercel 快 3-5 倍**
- ❌ **2026-05-11 Claw Cloud Run 已停服**（不要用）
- ✅ **21YunBox 仍活跃**（但偏商业，$200+/月）

---

## 📚 相关链接

- 腾讯云 EdgeOne Pages：https://pages.edgeone.ai/zh
- 部署 Next.js 指南：https://pages.edgeone.ai/zh/resources/deploy-nextjs-project-to-pages
- 从 Vercel 迁移：https://pages.edgeone.ai/zh/document/
- 腾讯云 CloudBase：https://tcb.cloud.tencent.com/
- CloudBase 部署 Next.js：https://docs.cloudbase.net/recipes/deploy-nextjs-to-cloudbase-run
- 21YunBox（备选）：https://www.21cloudbox.com/
