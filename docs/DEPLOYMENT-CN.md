# 国内部署方案（2026 年 6 月）

> **目标**：在国内用免费方案替代 Vercel + Railway
> **适用**：政府项目、企业内网、国产化要求

---

## 🏆 推荐方案：阿里云 ESA Pages + 腾讯云 CloudBase

| 原方案 | 国内替代 | 优势 |
|---|---|---|
| **Vercel** | **阿里云 ESA Pages** | 国内节点快、中文支持、深度集成钉钉 |
| **Railway** | **腾讯云 CloudBase** | 一体化 BaaS（数据库 + 存储 + 函数） |
| **PostgreSQL (Railway)** | **腾讯云 PostgreSQL / 达梦 DM8** | 国产化兼容、To-G 友好 |
| **Redis (Railway)** | **腾讯云 Redis** | 低延迟、政府合规 |

---

## 🎯 阿里云 ESA Pages（替代 Vercel）

### 简介
- **正式发布**：2026 年 2 月
- **官网**：https://www.aliyun.com/product/esa
- **特色**：
  - 国内访问速度比 Vercel/Cloudflare 快 3-5 倍
  - 边缘渲染 + 全球分发
  - 兼容 Next.js / React / Vue
  - 全中文控制台
  - 钉钉技术支持

### 免费额度（2026-06）

| 项目 | 免费额度 |
|---|---|
| 部署次数 | 1000 次/月 |
| 流量 | 100 GB/月 |
| 算力 | 100 GB·小时 |
| 域名 | 免费支持自定义域名 + SSL |
| 团队 | 支持团队协作 |

### 部署 Next.js 项目

#### 1. 项目准备（已就绪）

我们项目已经准备好：
- `next.config.mjs` — 已配置 standalone 输出
- `apps/web/Dockerfile` — 多阶段构建

#### 2. 部署步骤

```bash
# 1. 登录阿里云
# https://www.aliyun.com/product/esa

# 2. 创建 Pages 项目
# - 选择 "导入 Git 仓库" 或 "上传文件"
# - 关联 GitHub 仓库（如果用 GitHub）

# 3. 配置环境变量（在 ESA 控制台）
DATABASE_URL=postgresql://reinvention:xxx@cloudbase.tencentcloud.com:5432/reinvention
MINIMAX_API_KEY=sk-...
NEXTAUTH_SECRET=...
ENCRYPTION_KEY=...
JWT_SECRET=...
NODE_ENV=production

# 4. 部署
# ESA 自动检测 Next.js，build & deploy
# 部署完成后获得：https://reinvention.esa.aliyun.com
```

#### 3. 自定义域名

```bash
# 1. 在 ESA 控制台添加域名 reinvention.cn
# 2. ESA 给出 CNAME 值（如 reinvention.esa.aliyun.com）
# 3. 在阿里云 DNS 添加 CNAME 记录
# 4. ESA 自动申请 SSL 证书
```

---

## 🎯 腾讯云 CloudBase（替代 Railway）

### 简介
- **官网**：https://tcb.cloud.tencent.com/
- **支持**：
  - 静态托管（Next.js 前端）
  - 云数据库（PostgreSQL，2026-05 上线）
  - 云函数（Python 后端）
  - 云存储（文件）
  - 身份认证（微信登录、邮箱登录）
  - 微信生态集成

### 免费额度

| 项目 | 免费额度 |
|---|---|
| 数据库 | 2 GB（PostgreSQL） |
| 存储 | 5 GB |
| 流量 | 5 GB/月 |
| 云函数调用 | 10 万次/月 |
| 托管容器 | 1 个最小实例 |

### 部署步骤

#### 1. 创建云开发环境

```bash
# 1. 登录腾讯云开发
# https://console.cloud.tencent.com/tcb

# 2. 创建环境（如 reinvention-prod）
# 3. 创建 PostgreSQL 数据库
```

#### 2. 数据库迁移

```bash
# 在本地导出
pg_dump -h localhost -U reinvention reinvention > backup.sql

# 导入到 CloudBase PostgreSQL
psql "postgresql://reinvention:password@reinvention-xxx.cloudbase.tencentcloud.com:5432/reinvention" < backup.sql
```

#### 3. 更新 .env

```bash
# apps/web/.env.local
DATABASE_URL="postgresql://reinvention:xxx@reinvention-xxx.cloudbase.tencentcloud.com:5432/reinvention"
```

#### 4. 部署爬虫（云函数）

```python
# apps/scraper/main.py 改造为云函数
def main_handler(event, context):
    # 调用 ScraperManager
    ...

# 或：直接用云托管（容器）
# 上传 Dockerfile 镜像到 CloudBase 云托管
```

#### 5. 部署前端（静态托管）

```bash
# 1. 构建
cd apps/web
pnpm build

# 2. 上传 .next/standalone 到 CloudBase 静态托管
# 3. 配置环境变量
# 4. 绑定自定义域名
```

---

## 🏆 完整推荐组合（最划算）

### 方案 A：阿里云 ESA + 腾讯云 CloudBase（混合）

```
┌─────────────────────────────────────────────┐
│  阿里云 ESA Pages（前端 Next.js）            │
│  https://reinvention.cn                      │
│  - 边缘渲染                                  │
│  - 自动 HTTPS                                 │
│  - 国内 CDN                                  │
│  - 100 GB 流量/月 免费                       │
└─────────────────────────────────────────────┘
                    ↓ fetch
┌─────────────────────────────────────────────┐
│  腾讯云 CloudBase（一站式后端）              │
│  - PostgreSQL（2 GB 免费）                   │
│  - 云函数（Python 爬虫）                    │
│  - 云存储（用户简历）                        │
│  - 身份认证（微信登录）                      │
│  - 国内访问快                                │
└─────────────────────────────────────────────┘
```

**总成本**：¥0/月（都在免费额度内）

**用户量支持**：
- ESA Pages：~10,000 月活
- CloudBase PostgreSQL：~50,000 行数据
- 云函数：~50 万次调用/月

### 方案 B：纯腾讯云 CloudBase（最简单）

如果想避免跨云：
```
┌─────────────────────────────────────────────┐
│  腾讯云 CloudBase 静态托管（前端）           │
│  - 兼容 Vercel                               │
│  - Git 集成                                  │
│  - 自动构建                                  │
│  - 5 GB 流量/月 免费                         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  腾讯云 CloudBase（后端）                    │
│  - 云数据库 PostgreSQL                       │
│  - 云函数（爬虫）                            │
│  - 云存储                                    │
│  - 一体化微信登录                            │
└─────────────────────────────────────────────┘
```

**总成本**：¥0/月

**优势**：
- 一个平台搞定所有
- 微信生态深度集成（公众号、小程序、企业微信）
- To-G 项目最看重（人社部门很多用微信工作）

### 方案 C：国产化（政府内部部署）

如果必须完全自主可控：
```
┌─────────────────────────────────────────────┐
│  国产化替代：                                │
│  - 操作系统：麒麟 OS / 统信 UOS              │
│  - 数据库：达梦 DM8 / 人大金仓              │
│  - 中间件：东方通 TongWeb                    │
│  - 服务器：华为 TaiShan / 长城              │
└─────────────────────────────────────────────┘
```

无月费，但要自己运维。

---

## 🚀 迁移到 ESA Pages（步骤详解）

### 1. 准备项目（已就绪）

我们的 `next.config.mjs` 已配置：
- `transpilePackages` — 支持 monorepo
- `output: standalone` — 独立输出

### 2. 创建阿里云 ESA 项目

```
1. 访问 https://www.aliyun.com/product/esa
2. 点击"立即开通"（免费）
3. 进入控制台 → Pages → 创建项目
4. 选择"导入 Git 仓库"
5. 选择 GitHub 仓库 + 分支
6. 配置：
   - 框架：Next.js
   - 构建命令：cd apps/web && pnpm install && pnpm build
   - 输出目录：apps/web/.next
7. 添加环境变量（从 .env.local 复制）
8. 点击"部署"
```

### 3. 验证部署

```bash
# ESA 提供 URL：https://xxx.esa.aliyun.com
curl https://xxx.esa.aliyun.com/
curl https://xxx.esa.aliyun.com/api/jobs/list
```

### 4. 自定义域名

```
1. 在 ESA 控制台 → 域名管理 → 添加域名 reinvention.cn
2. 在阿里云 DNS 添加 CNAME 记录
3. ESA 自动申请 SSL 证书
4. 等待 10 分钟生效
```

### 5. 监控

```
ESA 控制台 → 监控：
- 部署历史
- 访问量
- 错误日志
```

---

## 🗄️ 迁移数据库到 CloudBase PostgreSQL

### 1. 创建数据库

```bash
# 1. 登录腾讯云开发
# https://console.cloud.tencent.com/tcb

# 2. 进入"数据库" → 创建 PostgreSQL 实例
# 3. 设置密码 + 允许外部访问（白名单）
```

### 2. 导出 + 导入数据

```bash
# 本地导出
DATABASE_URL="postgresql://..." npx prisma db pull
# 或者用 pg_dump
pg_dump -h localhost -U reinvention reinvention > backup.sql

# 导入到 CloudBase
# 在 CloudBase 控制台 → 数据库 → 连接信息
psql "postgresql://reinvention:password@gateway.xxx.cloudbase.tencentcloud.com:5432/reinvention" < backup.sql
```

### 3. 更新 Prisma

```bash
# .env.local
DATABASE_URL="postgresql://reinvention:password@gateway.xxx.cloudbase.tencentcloud.com:5432/reinvention?sslmode=require"
```

### 4. 测试连接

```bash
npx prisma db pull
```

---

## 🐍 部署 Python 爬虫到 CloudBase 云函数

### 1. 改造 main.py

```python
# apps/scraper/cloud_function_main.py
from fastapi import FastAPI
from src.scrapers.manager import ScraperManager

app = FastAPI()
manager = ScraperManager()

@app.post("/scrape/company-careers")
async def scrape_company_careers(payload: dict):
    results = await manager.collect_jobs(
        company_name=payload.get("company_name", ""),
        sources=["company_website"],
    )
    return {"success": True, "total": len(results), "jobs": [...]}
```

### 2. 部署到 CloudBase

```bash
# 在 CloudBase 控制台
# 云函数 → 创建函数
# - 运行环境：Python 3.12
# - 上传 zip 包
# - 设置入口：main_handler
```

### 3. 或用云托管（容器）

```bash
# CloudBase 云托管
# - 上传 Dockerfile 镜像
# - 配置 1 个最小实例
# - 免费额度内
```

---

## 💰 成本对比

### Vercel + Railway（国外）

| 服务 | 免费额度 | 超出后 |
|---|---|---|
| Vercel | 100 GB 流量 | $20/月 起 |
| Railway | $5/月 | $5 + 0.000463/分钟 |
| PostgreSQL (Railway) | 包含在 $5 | 单独计费 |
| **总计** | **$0** | **$20-50/月** |

### 国内方案（阿里云 ESA + 腾讯云 CloudBase）

| 服务 | 免费额度 | 超出后 |
|---|---|---|
| 阿里云 ESA Pages | 100 GB 流量 | ¥0.18/GB |
| 腾讯云 CloudBase | 2 GB DB + 5 GB 流量 | ¥0.09/GB |
| 腾讯云 PostgreSQL | 2 GB | ¥0.05/小时 |
| **总计** | **¥0** | **根据用量** |

**月活 1 万以下**：完全免费
**月活 10 万**：约 ¥50-200/月（比 Vercel+Railway 便宜 50%）

---

## 🎯 迁移清单

### ESA Pages（前端）
- [x] 项目已支持 standalone 构建
- [x] 阿里云账号
- [ ] 创建 ESA 项目
- [ ] 配置环境变量
- [ ] 配置自定义域名
- [ ] 验证部署

### CloudBase（后端）
- [x] Prisma 已支持 PostgreSQL
- [ ] 创建 CloudBase PostgreSQL
- [ ] 迁移数据
- [ ] 更新 .env DATABASE_URL
- [ ] 部署爬虫（云函数 / 云托管）
- [ ] 配置 API 网关

### 微信生态（可选）
- [ ] 配置微信公众号登录
- [ ] 配置微信小程序（如果做）
- [ ] 配置企业微信（如果 To-G 客户用）

---

## 🚨 注意事项

1. **微信小程序备案**：政府 To-G 项目通常需要 ICP 备案 + 微信小程序备案
2. **数据合规**：用户简历数据属于敏感个人信息，需符合《个保法》
3. **国产化要求**：部分政府项目要求麒麟 OS、达梦数据库
4. **访问速度**：国内访问 Vercel 慢（5-10 秒），ESA < 100ms
5. **运维团队**：需要熟悉阿里云 + 腾讯云控制台

---

## 📋 推荐实施顺序

```
第 1 周：
- 创建阿里云账号 + 腾讯云账号
- 创建 ESA Pages 项目
- 创建 CloudBase PostgreSQL
- 域名备案（如需要）

第 2 周：
- 迁移数据库（导出 + 导入）
- 配置环境变量
- 部署前端
- 部署爬虫

第 3 周：
- 自定义域名
- 监控 + 日志
- 性能优化

第 4 周：
- 上线运营
- 100 个种子用户内测
- 开始 To-G 销售
```

---

## 🌐 相关链接

- 阿里云 ESA：https://www.aliyun.com/product/esa
- ESA 免费领取：http://s.tb.cn/e6.0Fu67m
- 腾讯云开发 CloudBase：https://tcb.cloud.tencent.com/
- 腾讯云 PostgreSQL：https://cloud.tencent.com/product/postgres
- 阿里云函数计算：https://www.aliyun.com/product/fc
