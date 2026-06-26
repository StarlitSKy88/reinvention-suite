# EdgeOne Pages 部署清单（可立即执行）

> **目标**：把当前代码部署到 EdgeOne Pages
> **预计时间**：30 分钟
> **完全免费 + 国内快 3-5 倍**

## 📋 部署前检查

### 已准备好的资产 ✅

```
✅ 前端：Next.js 14（apps/web/）
✅ 后端：Go + Gin（apps/api-go/）
✅ EdgeOne 配置：edgeone.json
✅ 13 个问题 + 4 轮诊断 Prompt
✅ 多轮 UI：/diagnose
✅ 4 个 API 端点
✅ README 文档
```

### 还需要你做的

```
□ 1. 在 GitHub 创建仓库
□ 2. push 代码
□ 3. 在 EdgeOne Pages 创建项目
□ 4. 配置环境变量
□ 5. 部署
□ 6. 验证访问
```

---

## 🚀 步骤 1：创建 GitHub 仓库（5 分钟）

### A. 在 GitHub.com 创建仓库

1. 访问 https://github.com/new
2. 填写：
   - **Repository name**: `reinvention-suite`（或你喜欢的名字）
   - **Description**: "从 0 到 500 万 AI 诊断 - Go + Next.js"
   - **Public** / **Private**（推荐 Private）
   - **不要**勾选 "Add a README"（我们已有）
3. 点击 "Create repository"

### B. 本地 push 代码

```bash
cd /Users/opc-1/Downloads/O/jianli/reinvention-suite

# 1. 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/reinvention-suite.git

# 2. 确保 main 分支
git branch -M main

# 3. Push
git push -u origin main
```

如果遇到问题：
```bash
# 第一次 push 可能需要认证
# 推荐用 Personal Access Token（Settings → Developer settings → PAT）
# 或 SSH key
```

---

## 🚀 步骤 2：在 EdgeOne Pages 创建项目（10 分钟）

### A. 访问控制台

1. 访问 https://console.cloud.tencent.com/edgeone/pages
2. 微信扫码登录（推荐）或 QQ/邮箱
3. 实名认证（首次使用需要，国内政策）

### B. 创建项目

1. 点击「创建项目」或「Create Project」
2. 选择「从 Git 仓库导入」
3. 关联 GitHub 账号
   - 第一次需要 OAuth 授权
   - 授权后选择您的 `reinvention-suite` 仓库
4. 配置项目设置：

| 配置项 | 推荐值 |
|---|---|
| 项目名称 | `reinvention` |
| 框架预设 | Next.js（自动检测）|
| 构建命令 | 留空（使用 edgeone.json）|
| 输出目录 | 留空 |
| Node 版本 | 20.x |
| 加速区域 | 中国大陆 + 全球（推荐）|

5. 点击「开始部署」

### C. 配置环境变量

在项目设置 → 环境变量，添加：

| Key | Value | 必需 |
|---|---|---|
| `MINIMAX_API_KEY` | `sk-cp-qphKTDLp2ThIAIrktrui1F9w5mU3K7QVo9EiZcTzzqlcCmosvE8PgdgH_j6Wadm0bPK7KIKgOp1tscWfDPv8OGlWgux7DddOA1PYBemiXR6kk9TyhjGPWyg` | ✅ |
| `MINIMAX_BASE_URL` | `https://api.MiniMax.chat/v1` | ❌ |
| `MINIMAX_MODEL` | `MiniMax-M3` | ❌ |
| `DB_PATH` | `file::memory:?cache=shared` | ❌（默认内存）|

---

## 🚀 步骤 3：等待部署完成（5-10 分钟）

EdgeOne Pages 会自动：
1. 克隆您的 GitHub 仓库
2. 构建 Next.js 前端（`pnpm install && pnpm build`）
3. 编译 Go Cloud Functions（`GOOS=linux GOARCH=amd64`）
4. 部署到边缘节点
5. 配置路由：`/` → 前端，`/api/diagnose/*` → Go 后端
6. 申请 SSL 证书（自动）

**首次部署：5-10 分钟**
**后续部署（git push）：1-2 分钟**

---

## 🚀 步骤 4：验证部署（5 分钟）

部署完成后，访问您的域名（默认是 `xxx.edgeone.app`）：

### 验证 1：首页

```
https://reinvention.edgeone.app/
```

应该看到黑底白字红字首页。

### 验证 2：诊断页面

```
https://reinvention.edgeone.app/diagnose
```

应该看到"从 0 到 500 万 / AI 诊断"。

### 验证 3：API（直接 curl）

```bash
# 测试 Start API
curl -X POST https://reinvention.edgeone.app/api/diagnose/start \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'

# 应该返回：
# {
#   "success": true,
#   "sessionId": "diag_xxx",
#   "currentRound": 1,
#   "questions": [...]
# }
```

### 验证 4：完整多轮流程

在浏览器中：
1. 打开 https://reinvention.edgeone.app/diagnose
2. 点击「开始诊断」
3. 回答 Round 1 的 3 个问题
4. 应该看到"第 1 轮总结"（AI 调用）
5. 继续 Round 2/3/4
6. 最后看到 2000 字方案

---

## 🚀 步骤 5：（可选）配置自定义域名

### 5.1 购买域名（阿里云/腾讯云）
- 推荐 `.cn` 或 `.com` 域名（¥30-80/年）
- 阿里云：https://wanwang.aliyun.com
- 腾讯云：https://dnspod.cn

### 5.2 配置 DNS
在域名注册商添加 CNAME 记录：
```
类型: CNAME
主机: reinvention（或 @）
值: reinvention.edgeone.app
TTL: 600
```

### 5.3 在 EdgeOne 添加域名
1. 项目设置 → 域名管理
2. 添加域名 `reinvention.cn`
3. 自动申请 SSL 证书（5-15 分钟）

### 5.4 验证
```
https://reinvention.cn
```

---

## 🛠 常见问题排查

### Q1: 部署失败 - "Build timeout"
**原因**：前端构建时间超过 10 分钟（限制）
**解决**：
```bash
# 优化 next.config.mjs
# 增加 output: 'standalone'（已加）
# 使用 pnpm 代替 npm（已用）
```

### Q2: API 调用失败 - "Function not found"
**原因**：EdgeOne 没识别 Go 函数
**解决**：
1. 检查 `cloud-functions/api-go/main.go` 存在
2. 检查 `edgeone.json` 的 `entry` 路径
3. 查看 EdgeOne 构建日志

### Q3: LLM 调用失败 - "API key invalid"
**原因**：环境变量没传
**解决**：
1. 在 EdgeOne 控制台 → 环境变量
2. 添加 `MINIMAX_API_KEY`（注意不是空的）
3. 重新部署

### Q4: SQLite 数据丢失
**原因**：进程内 SQLite 每次冷启动重置
**解决**：
- MVP：可接受（5 分钟调试）
- 生产：接 Cloudflare D1

### Q5: 访问慢
**检查**：
- 加速区域是否选了"中国大陆"
- 域名是否备案（如果选中国大陆）

---

## 💰 成本确认

| 项目 | 成本 |
|---|---|
| GitHub 私有仓库 | $0（免费层）|
| EdgeOne Pages 部署 | $0（永久免费）|
| 域名（可选）| ¥30-80/年 |
| 流量 | $0（不限量）|
| 请求数 | $0（10 万/天免费）|
| 存储 | $0（10GB）|

**总成本：$0 + 可选域名 ¥30-80/年**

---

## 📋 部署完成检查清单

### 立即验证

```bash
# 1. 访问前端
https://reinvention.edgeone.app/  → ✅ 看到首页

# 2. 访问诊断页
https://reinvention.edgeone.app/diagnose  → ✅ 看到聊天界面

# 3. 测试 API
curl -X POST https://reinvention.edgeone.app/api/diagnose/start \
  -H "Content-Type: application/json" \
  -d '{}'
# → ✅ 返回 sessionId

# 4. 完整 4 轮测试
# 在浏览器中走一遍
# → ✅ 看到 AI 总结 + 2000 字方案
```

### 部署后可以做的优化

- [ ] 集成 Cloudflare D1（持久化）
- [ ] 集成支付（¥99 起）
- [ ] 添加用户认证
- [ ] 添加邮件通知
- [ ] 集成 Cloudflare Analytics
- [ ] 配置自定义域名 + SSL

---

## 🎯 部署成功的标志

当您看到：

```
✓ https://reinvention.edgeone.app/ 显示首页
✓ https://reinvention.edgeone.app/diagnose 显示聊天界面
✓ 走完 4 轮后看到"你的 500 万路径"
✓ curl API 返回真实数据
```

**🎉 部署成功！可以开始找 5 个朋友体验测试 → 验证付费意愿 → 决定是否规模化**

---

## 📞 遇到问题？

### 文档参考
- EdgeOne Pages 文档：https://pages.edgeone.ai/zh
- Go 运行时：https://pages.edgeone.ai/zh/document/go
- Cloud Functions：https://pages.edgeone.ai/zh/document/cloud-functions
- 部署指南：docs/DEPLOYMENT-FREE.md

### 调试步骤
1. 查看 EdgeOne 构建日志
2. 检查环境变量
3. 用 curl 测试 API
4. 查看浏览器 console 错误

---

## 🎉 部署后的下一步

1. **本周**：找 5 个朋友体验多轮 AI 诊断
2. **下周**：集成 ¥99 支付（微信 / Stripe）
3. **第 3 周**：找 50 个付费用户
4. **第 4 周**：决定是否规模化

**祝部署顺利！** 🚀
