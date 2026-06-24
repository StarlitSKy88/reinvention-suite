# 2026 年新部署平台地图（替代 Vercel + Railway）

> **搜索范围**：GitHub + Product Hunt（2026 年最新）
> **更新时间**：2026-06-25

## 🏆 成熟度排序（按 Stars + 活跃度）

| # | 项目 | Stars | 创建 | 状态 | 特点 |
|---|---|---|---|---|---|
| 1 | **Dokploy** | 34,915 | 2024-04 | v0.29.8（2026-06-08）| 最成熟的开源 PaaS |
| 2 | **Dokploy Cloud** | - | 2024-11 | 正式版 | Dokploy 官方云版 |
| 3 | **DevPush** | 4,679 | 2025-01 | 活跃 | 多语言、Vercel-like |
| 4 | **Frost** | 326 | 2025-05 | v0.20.2（2026-03-11）| TypeScript + Bun |
| 5 | **Dokploy fork** | 50+ | - | - | 各种 fork |

## 🆕 2026 年新项目

| 项目 | Stars | 创建 | 最新 | 适合 |
|---|---|---|---|---|
| **Plorigo** | 6 | 2026-06-05 | v1.0.0-beta（2026-06-15）| BYOS、Vercel-like |
| **Layerrail Deploy** | 0 | 2026-06-23 | - | Dokploy fork |
| **Hatch** | 2 | 2026-04-01 | v0.1.0（2026-05-31）| AWS 用户 |
| **Deployra** | 4 | 2026-01-30 | - | Hetzner 用户 |
| **Pushpaka** | 2 | 2026-03-15 | v1.0.0.38（2026-06-04）| 多 worker |
| **OpenBerth** | 34 | 2026-02-20 | - | 极简 gVisor |
| **Towlion** | 6 | 2026-03-15 | - | GitHub 原生 |
| **Forge** | 0 | 2026-04-29 | v1.0.0（2026-05-07）| 无 Docker |
| **SYJ Deploy** | 1 | 2026 | - | Android 手机也能跑 |

---

## 🏆 推荐：**Dokploy**（成熟度最高）

### 为什么是它？

- ✅ **34,915 stars**（是其他新项目的 100+ 倍）
- ✅ **v0.29.8**（2026-06-08，**3 周前更新**）
- ✅ **明确说"Open Source Alternative to Vercel, Netlify and Heroku"**
- ✅ Docker + Traefik（标准成熟方案）
- ✅ **有 Dokploy Cloud** 付费版（如果你不想自托管）
- ✅ 完整功能：PostgreSQL、MySQL、MongoDB、Redis、备份、监控、SSL

### 官网
- GitHub：https://github.com/dokploy/dokploy
- 官网：https://dokploy.com/
- Cloud：https://app.dokploy.com/

### 一键安装

```bash
# 在你的 VPS 上（Ubuntu 22.04+）
curl -sSL https://dokploy.com/install.sh | sh
```

### 部署我们的项目

```bash
# 1. 在 Dokploy 创建 Application
# 2. 关联 GitHub 仓库
# 3. 选 Docker 部署
# 4. 配置环境变量
# 5. 自动 build + deploy

# 部署后获得：https://reinvention.<your-domain>.com
```

### Dokploy Cloud（付费免运维）

- 不想自己运维 VPS？
- Dokploy Cloud 提供托管版
- 价格：<$10/月 个人项目
- 包含数据库 + 部署 + 域名

---

## 🥈 推荐：**腾讯云 EdgeOne Pages**（国内快）

### 适合 To-G 项目

- 永久免费（不限量流量）
- 国内节点比 Vercel 快 3-5 倍
- Next.js 完整支持
- 但仅托管前端，后端需要其他方案

---

## 💎 推荐组合：**Dokploy 自托管**

```
┌─────────────────────────────────────┐
│  Dokploy（自托管 / Dokploy Cloud）    │
│  https://dokploy.com/                │
│  - Next.js 前端部署                  │
│  - Python FastAPI 后端                │
│  - PostgreSQL 数据库                 │
│  - Redis 缓存                        │
│  - 自动 SSL + 自定义域名            │
│  - 完整 PaaS 体验                    │
└─────────────────────────────────────┘

总成本：
- 自托管：VPS $5-20/月
- Dokploy Cloud：$10/月（含 DB）
```

**vs Vercel + Railway**：
- Vercel：$20/月（强制 Pro）+ Railway $5
- **Dokploy 自托管：$5-10/月 VPS**
- 节省 70-80%

---

## 🔍 项目对比表（详细）

| 项目 | 类型 | Stars | 部署方式 | 数据库 | 适合 |
|---|---|---|---|---|---|
| **Dokploy** | Docker PaaS | 34.9k | VPS 自托管 | PostgreSQL/MySQL/Mongo | **通用（成熟）** |
| **Dokploy Cloud** | 托管 | - | 零配置 | 包含 | 不想运维 |
| **EdgeOne Pages** | 边缘 | - | 零配置 | 外部 | **国内** |
| **DevPush** | Docker | 4.7k | VPS | 包含 | 多语言 |
| **Frost** | TypeScript | 326 | VPS | - | 现代栈 |
| **Plorigo** | Docker | 6 | VPS | PostgreSQL | 新项目尝鲜 |
| **Hatch** | AWS | 2 | ECS Fargate | - | AWS 用户 |
| **Deployra** | K8s | 4 | Hetzner | - | K8s 爱好者 |
| **Pushpaka** | Docker | 2 | VPS | - | 多 worker |
| **OpenBerth** | gVisor | 34 | VPS | SQLite | 极简 |
| **SYJ Deploy** | 无 Docker | 1 | 任何 | - | demo |
| **21YunBox** | SaaS | - | 零配置 | 包含 | **国内加速** |

---

## 🚀 我们的推荐选择

### 如果想要最简单（零运维）：

```
✅ 腾讯云 EdgeOne Pages（前端，永久免费）
+ Dokploy Cloud（后端，$10/月）
+ 21YunBox（非商业免费层，国内加速）
```

### 如果想要最省钱（自托管）：

```
✅ Dokploy（一个 VPS 解决所有）
   - VPS：$5-20/月（Hetzner / DigitalOcean）
   - 一键部署所有服务
   - 包含数据库
```

### 如果用户主要在国内：

```
✅ 腾讯云 EdgeOne Pages（前端）
+ Dokploy 自托管在国内 VPS（后端）
```

### 如果想纯免费 + 跑通整个流程：

```
✅ Dokploy 自托管 + 国内 VPS（阿里云轻量 / 腾讯云轻量）
   - ¥24-50/月 国内 VPS
   - Dokploy 一键部署所有
   - 国内访问比国外方案快 10 倍
```

---

## 📋 我们的具体部署计划

### 推荐方案：Dokploy 自托管（国内 VPS）

```bash
# 1. 买国内 VPS（阿里云/腾讯云轻量）
# 规格：2C4G，¥24-50/月
# 地区：香港/上海（无需 ICP 备案）

# 2. SSH 登录
ssh root@your-vps

# 3. 一键安装 Dokploy
curl -sSL https://dokploy.com/install.sh | sh

# 4. Web UI 配置（8000 端口）
# 访问 http://your-vps-ip:3000

# 5. 创建 Application（关联 GitHub）
# 6. 配置环境变量
# 7. 添加 PostgreSQL + Redis（内置）
# 8. 配置域名 + SSL
```

---

## 💡 关键观察

1. **Dokploy 是事实上的开源 PaaS 之王**（35k stars vs 其他 100+ 倍差距）
2. **2026 年新项目都是 Dokploy 复制品**（Plorigo、Layerrail 等都是 fork 或类比）
3. **Dokploy Cloud** 是对 Vercel/Railway 的最直接替代
4. **国内方案**：EdgeOne Pages（前端）+ Dokploy 自托管（后端）
5. **最省钱方案**：Dokploy 自托管（$5-10/月 vs Vercel $20+/月）

---

## 📚 相关链接

- **Dokploy**：https://github.com/dokploy/dokploy
- **Dokploy Cloud**：https://app.dokploy.com/
- **Plorigo**：https://github.com/Plorigo/plorigo
- **DevPush**：https://github.com/hunvreus/devpush
- **Frost**：https://github.com/elitan/frost
- **EdgeOne Pages**：https://pages.edgeone.ai/zh
