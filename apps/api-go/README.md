# Go (Gin) 后端 — 多轮 AI 诊断

> **核心产品**：从 0 到 500 万 AI 诊断
> **运行时**：Go 1.22+（EdgeOne 支持 1.26）
> **Web 框架**：Gin（推荐）/ Echo / Fiber / Chi

## 🚀 快速开始

```bash
# 安装 Go（1.22 或更高）
brew install go  # macOS
# 或
# apt install golang-go  # Linux

# 安装依赖
cd apps/api-go
go mod tidy

# 设置环境变量
export MINIMAX_API_KEY="sk-..."
export DB_PATH="./reinvention.db"

# 启动
go run cmd/api/main.go

# 服务运行在 http://localhost:9000
```

## 📋 API 端点

### POST /api/diagnose/start
启动诊断会话，返回 sessionId + Round 1 的 3 个问题。

**请求**：
```json
{ "userId": "demo-user" }
```

**响应**：
```json
{
  "success": true,
  "sessionId": "diag_xxx_xxx",
  "currentRound": 1,
  "totalRounds": 4,
  "questions": [
    { "id": "q1_situation", "question": "你现在的处境是什么？...", "promptHint": "..." },
    { "id": "q2_money_history", "question": "...", "promptHint": "..." },
    { "id": "q3_time", "question": "...", "promptHint": "..." }
  ],
  "startedAt": "2026-06-25T..."
}
```

### POST /api/diagnose/answer
提交本轮答案 → AI 总结 + 下一轮。

**请求**：
```json
{
  "sessionId": "diag_xxx_xxx",
  "answers": [
    { "questionId": "q1_situation", "answer": "失业 5 个月..." },
    { "questionId": "q2_money_history", "answer": "..." },
    { "questionId": "q3_time", "answer": "..." }
  ]
}
```

**响应**：
```json
{
  "success": true,
  "summary": "我看到了你的基本情况...",
  "nextRound": 2,
  "complete": false,
  "questions": [
    { "id": "q4_resources", "question": "...", "promptHint": "..." },
    ...
  ]
}
```

### POST /api/diagnose/final
完成 4 轮后，获取 2000 字最终方案。

**请求**：
```json
{ "sessionId": "diag_xxx_xxx" }
```

**响应**：
```json
{
  "success": true,
  "analysis": "# 你的 500 万路径\n\n## 起点评估\n...",
  "completedAt": "2026-06-25T...",
  "totalRounds": 4,
  "questionsAnswered": 13
}
```

### GET /health
健康检查。

**响应**：
```json
{ "status": "ok", "runtime": "go-gin" }
```

## 📁 目录结构

```
apps/api-go/
├── cmd/api/
│   └── main.go              # 入口
├── internal/
│   ├── handlers/
│   │   └── diagnose.go     # 多轮诊断 API
│   ├── db/
│   │   └── db.go           # SQLite/D1 操作
│   ├── ai/
│   │   └── llm.go          # MiniMax HTTP 客户端
│   └── models/
│       └── types.go         # 数据类型
├── go.mod
├── go.sum
└── README.md
```

## 🗄 数据库

### MVP：进程内 SQLite
```go
dbPath := ":memory:"
// 或
dbPath := "file:reinvention.db?cache=shared"
```

### 生产：Cloudflare D1（兼容 SQLite）
```go
// 部署到 EdgeOne Cloud Functions 时：
// - SQLite 进程内数据
// - 或外接 Cloudflare D1
```

### Schema

```sql
CREATE TABLE diagnose_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  current_round INTEGER NOT NULL DEFAULT 1,
  answers_json TEXT NOT NULL DEFAULT '{}',
  plan_text TEXT DEFAULT ''
);

CREATE INDEX idx_user ON diagnose_sessions(user_id);
CREATE INDEX idx_completed ON diagnose_sessions(completed_at);
```

## 🤖 LLM 集成

使用原生 `net/http` 调用 MiniMax API（无 SDK 依赖）。

```go
// internal/ai/llm.go
type Client struct {
    BaseURL string
    APIKey  string
    Model   string
}

func (c *Client) Chat(systemPrompt, userPrompt string, maxTokens int) (string, error) {
    // POST https://api.MiniMax.chat/v1/chat/completions
    // 返回 content
}
```

## 🧠 4 轮问题（13 问）

| 轮次 | 主题 | 题目数 |
|---|---|---|
| 1 | 基本情况 | 3 |
| 2 | 资源盘点 | 3 |
| 3 | 成败历史 | 3 |
| 4 | 偏好与目标 | 4 |

完整问题见 `internal/handlers/diagnose.go` 的 `roundQuestions` 变量。

## 🔄 完整流程

```
用户访问 /diagnose
  ↓
POST /api/diagnose/start
  → 返回 sessionId + Round 1 的 3 个问题
  ↓
用户回答 3 个问题（前端 UI）
  ↓
POST /api/diagnose/answer
  → AI 调用 LLM 生成总结
  → 返回 "第 1 轮总结" + Round 2 的 3 个问题
  ↓
（重复 4 轮）
  ↓
POST /api/diagnose/final
  → AI 调用 LLM 生成 2000 字最终方案
  → 返回完整方案
```

## 🚀 部署到 EdgeOne Pages

### 1. 推送代码到 GitHub

```bash
git add .
git commit -m "feat: Go backend for AI diagnosis"
git push origin main
```

### 2. 在 EdgeOne Pages 控制台

1. 创建新项目 → 关联 GitHub 仓库
2. EdgeOne Pages 会自动检测 `edgeone.json` 配置
3. 自动构建：
   - 前端：Next.js（在 `apps/web/`）
   - 后端：Go Cloud Functions（在 `cloud-functions/api-go/`）
4. 部署完成后，前端在 `/`，API 在 `/api/diagnose/*`

### 3. 访问

```
前端：https://reinvention.edgeone.app/
API：https://reinvention.edgeone.app/api/diagnose/start
```

**同域名！同端口！无 CORS！**

## 🔧 配置

### 环境变量

```bash
# LLM API
MINIMAX_API_KEY="sk-cp-..."        # 必填
MINIMAX_BASE_URL="https://api.MiniMax.chat/v1"  # 可选
MINIMAX_MODEL="MiniMax-M3"          # 可选

# 数据库
DB_PATH="file::memory:?cache=shared"  # 默认（每次冷启动重置）
# 或
DB_PATH="./reinvention.db"  # 本地持久化

# 服务
PORT="9000"  # 默认
```

### EdgeOne Pages 环境变量

在控制台 → 项目设置 → 环境变量 配置。

## 🧪 本地测试

```bash
# 启动服务
go run cmd/api/main.go

# 测试
curl -X POST http://localhost:9000/api/diagnose/start \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo-user"}'

# 模拟前端 UI 调用
curl -X POST http://localhost:9000/api/diagnose/answer \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "diag_xxx",
    "answers": [
      {"questionId": "q1_situation", "answer": "失业 5 个月，原月薪 15k"},
      {"questionId": "q2_money_history", "answer": "帮人做 PPT 5000 元"},
      {"questionId": "q3_time", "answer": "工作日 2 小时周末 8 小时"}
    ]
  }'
```

## 📦 与前端集成

前端 (`/diagnose` 页面) 通过 fetch 调用：

```typescript
// 启动
const res = await fetch('/api/diagnose/start', {
  method: 'POST',
  body: JSON.stringify({ userId: 'demo-user' }),
});

// 提交
const res = await fetch('/api/diagnose/answer', {
  method: 'POST',
  body: JSON.stringify({ sessionId, answers }),
});

// 最终方案
const res = await fetch('/api/diagnose/final', {
  method: 'POST',
  body: JSON.stringify({ sessionId }),
});
```

**同域名部署**（EdgeOne Pages），无需 CORS 配置。

## 🔄 EdgeOne Cloud Functions 部署说明

### 优势
- ✅ 自动 Go 1.26 运行时
- ✅ 自动交叉编译（`GOOS=linux GOARCH=amd64`）
- ✅ 自动端口映射（9000 → 80/443）
- ✅ 无需 Dockerfile
- ✅ 同域名、同项目、同仓库

### 触发部署

```bash
git push origin main
# EdgeOne Pages 自动：
# 1. 检测 cloud-functions/api-go/
# 2. 编译 Go 代码
# 3. 部署为 API
# 4. 路由 /api/diagnose/* → 此函数
```

## 📊 性能

- **冷启动**：< 100ms（Go 编译型）
- **每轮响应**：2-5 秒（含 LLM 调用）
- **内存**：~30MB
- **并发**：100+（Go goroutine）

## 🔐 安全考虑

- ✅ 不存储 PII
- ✅ 答案仅存在 session，24h 后自动清理（建议）
- ✅ 内部服务，不对外暴露 DB
- ✅ LLM API key 走环境变量

## 🚧 后续工作

- [ ] 数据库持久化（用 Cloudflare D1）
- [ ] 集成支付（¥99 起）
- [ ] 用户认证（NextAuth）
- [ ] 邮件通知（Resend）
- [ ] 多语言 Prompt 模板
- [ ] 评分系统（让 AI 评估自己输出质量）

## 📄 License

UNLICENSED - Private
