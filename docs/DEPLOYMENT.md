# Reinvention Suite — 部署文档

> **目标**：让任何人都能在 30 分钟内完成本地或服务器部署

---

## 🚀 快速开始（5 分钟）

### 1. 准备环境

```bash
# 安装 Docker + Docker Compose
# macOS
brew install docker docker-compose

# Ubuntu/Debian
sudo apt install docker.io docker-compose

# 验证
docker --version
docker compose version
```

### 2. 克隆代码

```bash
git clone <repo-url>
cd reinvention-suite
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，至少配置：
#   MINIMAX_API_KEY=...
#   ENCRYPTION_KEY=$(openssl rand -hex 32)
#   JWT_SECRET=$(openssl rand -hex 32)
```

### 4. 启动

```bash
docker compose up -d
# 等待 30 秒（首次启动会拉镜像、编译）

# 检查状态
docker compose ps
# 所有服务应该是 healthy 或 running

# 查看日志
docker compose logs -f web
```

### 5. 访问

```
🏠 首页：http://localhost
📊 政府看板：http://localhost/gov-dashboard
⚙️ 设置：http://localhost/settings
```

---

## 🏗️ 架构总览

```
┌──────────────────────────────────────────────┐
│  Nginx (反向代理 + HTTPS)                      │
│  ├── 80 → 443 重定向                          │
│  ├── 443 HTTPS 主入口                          │
│  └── /scraper/ 仅内部网络                       │
└─────────────┬────────────────────────────────┘
              │
       ┌──────┴──────┐
       ▼             ▼
┌──────────────┐ ┌──────────────┐
│  Next.js Web │ │  Python      │
│  (Port 3000) │ │  Scraper     │
│              │ │  (Port 8000) │
└──────┬───────┘ └──────┬───────┘
       │                │
       └────────┬───────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌────────┐
│Postgres│ │ Redis  │ │ Ollama │
│  16    │ │   7    │ │(可选)  │
└────────┘ └────────┘ └────────┘
```

---

## 📦 服务说明

| 服务 | 端口 | 用途 | 健康检查 |
|---|---|---|---|
| **nginx** | 80, 443 | 反向代理 + HTTPS | `curl http://localhost/health` |
| **web** | 3000 | Next.js 主应用 | `curl http://localhost:3000/` |
| **scraper** | 8000 | Python 爬虫微服务 | `curl http://localhost:8000/health` |
| **db** | 5432 | PostgreSQL | `pg_isready` |
| **redis** | 6379 | 缓存 + 限流 | `redis-cli ping` |
| **ollama** | 11434 | 本地 LLM（可选）| 仅启用 `--profile local-llm` 时 |

---

## 🔧 运维操作

### 查看日志

```bash
# 全部服务
docker compose logs -f

# 单个服务
docker compose logs -f web
docker compose logs -f scraper
docker compose logs -f db
```

### 重启服务

```bash
# 重启单个服务
docker compose restart web

# 重新构建并启动
docker compose up -d --build web
```

### 数据库操作

```bash
# 进入 PostgreSQL
docker compose exec db psql -U reinvention reinvention

# 备份数据库
docker compose exec db pg_dump -U reinvention reinvention > backup.sql

# 恢复数据库
cat backup.sql | docker compose exec -T db psql -U reinvention reinvention
```

### 清理

```bash
# 停止并删除容器
docker compose down

# 停止并删除容器 + 数据卷
docker compose down -v
```

---

## 🏭 生产环境部署

### 1. HTTPS 证书

把证书放到 `deploy/nginx/certs/`：
```
deploy/nginx/certs/
├── fullchain.pem   # 证书链
└── privkey.pem     # 私钥
```

可以用 Let's Encrypt 免费证书：
```bash
# 安装 certbot
sudo apt install certbot

# 申请证书
sudo certbot certonly --standalone -d your-domain.com

# 复制到项目
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem deploy/nginx/certs/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem deploy/nginx/certs/
```

### 2. 域名配置

修改 `deploy/nginx/nginx.conf`：
```nginx
server_name reinvention.example.com;  # 改为您的域名
```

### 3. 启动生产环境

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. 防火墙

```bash
# 只开放 80, 443
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 数据库和爬虫服务不对外暴露
```

---

## 🌐 离线 / 内网部署

适用于：政府内网、保密环境、国产化替代

### 方案 A：完全离线

```bash
# 1. 在有网络的机器上导出镜像
docker save -o reinvention-images.tar \
  reinvention-web:latest \
  reinvention-scraper:latest \
  postgres:16-alpine \
  redis:7-alpine \
  nginx:1.27-alpine

# 2. 复制到内网机器
scp reinvention-images.tar user@internal-server:~/

# 3. 在内网机器加载镜像
ssh user@internal-server
docker load -i reinvention-images.tar

# 4. 启动
docker compose up -d
```

### 方案 B：国产化替代

替换基础镜像：
- **操作系统**：麒麟 OS / 统信 UOS
- **数据库**：达梦 DM8 / 人大金仓 KingbaseES
- **中间件**：东方通 TongWeb

修改 `Dockerfile` 基础镜像 + Prisma datasource。

### 方案 C：使用本地 LLM（不依赖外网 API）

```bash
# 启动本地 LLM
docker compose --profile local-llm up -d ollama

# 下载模型
docker compose exec ollama ollama pull qwen2.5:7b

# 在 API 配置页面选择"自定义 Provider"
# Base URL: http://ollama:11434/v1
# Model: qwen2.5:7b
```

---

## 🔐 安全加固

### 1. 修改默认密钥

```bash
# 生成强随机密钥
openssl rand -hex 32

# 在 .env 中设置
ENCRYPTION_KEY=<your-random-key>
JWT_SECRET=<your-random-key>
NEXTAUTH_SECRET=<your-random-key>
INTERNAL_API_KEY=<your-random-key>
```

### 2. 数据库密码

修改 `docker-compose.yml`：
```yaml
db:
  environment:
    - POSTGRES_PASSWORD=<your-strong-password>
```

### 3. HTTPS 强制

`nginx.conf` 已默认开启 HTTP → HTTPS 重定向。

### 4. 防火墙规则

```bash
# 仅暴露 80, 443 到公网
# 数据库、Redis、爬虫仅内部网络访问
```

### 5. 审计日志

所有 API 调用都有审计日志：
```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100;
```

### 6. 定期备份

```bash
# 每天备份数据库
0 3 * * * docker compose exec -T db pg_dump -U reinvention reinvention | gzip > /backup/db-$(date +\%Y\%m\%d).sql.gz
```

---

## 📊 监控

### 健康检查

```bash
# 全部服务
curl http://localhost/health
curl http://localhost:3000/api/health
curl http://localhost:8000/health
```

### 资源监控

```bash
# 容器资源使用
docker stats

# 磁盘使用
docker system df

# 日志大小
docker compose logs --tail=1000 web | wc -l
```

### 推荐监控工具

- **Prometheus + Grafana**（开源）
- **Sentry**（错误监控）
- **PostHog**（用户行为分析）

---

## 🔄 升级

```bash
# 1. 备份数据
docker compose exec -T db pg_dump -U reinvention reinvention > backup-$(date +%Y%m%d).sql

# 2. 拉取新代码
git pull

# 3. 重新构建并启动
docker compose up -d --build

# 4. 数据库迁移（如果有）
docker compose exec web npx prisma migrate deploy

# 5. 验证
curl http://localhost/health
```

---

## 🆘 故障排查

### 服务无法启动

```bash
# 查看日志
docker compose logs web

# 常见问题：
# - 端口被占用：检查 3000, 8000, 5432, 6379 端口
# - 环境变量缺失：检查 .env 文件
# - 数据库连接失败：等 30 秒（db 健康检查）
```

### 数据库错误

```bash
# 重置数据库（⚠️ 清除所有数据）
docker compose down -v
docker compose up -d
```

### 爬虫失败

```bash
# 查看爬虫日志
docker compose logs scraper

# 测试爬虫
curl -X POST http://localhost:8000/api/v1/scrape/company-careers \
  -H "Content-Type: application/json" \
  -d '{"company_name": "腾讯"}'
```

### AI 调用失败

```bash
# 在 /settings/api 测试连接
# 检查 API Key 是否正确
# 检查网络是否能访问 Provider
```

---

## 📞 支持

- GitHub Issues: <repo-url>/issues
- 邮箱：support@reinvention.example
- 文档：docs.reinvention.example
