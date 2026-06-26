# 验证清单：每个功能完成前必跑

> **目的**：避免"看起来完成"假象，确保每个功能都真正可用
> **使用**：每个 /goal 任务完成后，对照此清单验证

---

## ✅ 通用验证（每个功能都跑）

### 1. 类型 + 构建

```bash
cd apps/web
npx tsc --noEmit            # → 0 errors
NEXT_TELEMETRY_DISABLED=1 npx next build   # → 成功
```

### 2. 服务运行

```bash
# 启动 dev server
pkill -f "next dev" 2>/dev/null
sleep 2
DATABASE_URL="postgresql://opc-1@localhost:5432/reinvention" \
  nohup npx next dev --port 3030 > /tmp/dev.log 2>&1 &
sleep 10

# 检查所有路由 200
for p in / /about /gov-dashboard /privacy /resume/upload \
         /resume/analyze /match/jobs /projects /deliver \
         /settings /settings/api; do
  echo "$p: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3030$p)"
done
# 期望：所有都是 200
```

### 3. 真实 API 调用

```bash
# 政府看板（从 DB 读取）
curl -s http://localhost:3030/api/gov/dashboard/cases?scope=city | python3 -m json.tool

# 投递路径
curl -s "http://localhost:3030/api/delivery/path?company=%E5%AD%97%E8%8A%82%E8%B7%B3%E5%8A%A8" | python3 -m json.tool
```

---

## 🔍 功能专项验证

### F1: 简历上传

```bash
# 1. 浏览器测试
playwright navigate http://localhost:3030/resume/upload
playwright screenshot  # 看到拖拽区

# 2. 实际下载一个测试 PDF
curl -o /tmp/test.pdf https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf
# （如果上面 URL 不可用，用任何 PDF 文件）

# 3. 模拟上传（需要真实浏览器交互）
playwright file_upload /tmp/test.pdf
playwright wait_for "解析"  # 看到进度
playwright wait_for "完成"  # 等待完成

# 4. 验证 IndexedDB 写入
# 在浏览器 DevTools > Application > IndexedDB > ReinventionAnalysisDB
# 应该看到新记录
```

**通过标准**：
- ✅ 5 步骤进度正确显示（解析 → 脱敏 → 结构化 → 年龄去敏 → 反歧视检测）
- ✅ 完成后自动跳转到 /resume/analyze?id=xxx
- ✅ IndexedDB 有新记录

### F2: 简历分析

```bash
playwright navigate "http://localhost:3030/resume/analyze?id=test-id"
playwright screenshot
```

**通过标准**：
- ✅ 3 个评分卡显示（年龄风险/偏见风险/综合）
- ✅ 风险检测项列表（不是空）
- ✅ 反歧视项显示 HR 心理解释
- ✅ 简历基本信息预览

### F3: 岗位匹配

```bash
playwright navigate "http://localhost:3030/match/jobs?analysisId=real-id"
playwright screenshot
```

**通过标准**：
- ✅ 5 个不同匹配分（不是全部相同）
- ✅ 每个匹配有 reasoning 文字
- ✅ "已匹配"用红色边框
- ✅ "待补全"用灰色边框

**关键**：
- ❌ 如果 5 个匹配分都一样 → 还在用 MOCK
- ❌ 如果 reasoning 是写死的 → 没有真实匹配

### F4: 项目孵化

```bash
playwright navigate "http://localhost:3030/projects?analysisId=real-id"
playwright screenshot
```

**通过标准**：
- ✅ 显示用户简历相关的项目（不是固定 10 个）
- ✅ 每个推荐有 reasoning（不是空）
- ✅ 推荐数量 ≤ 用户真实需求

### F5: 投递导航

```bash
playwright navigate "http://localhost:3030/deliver?company=%E5%AD%97%E8%8A%82%E8%B7%B3%E5%8A%A8"
playwright screenshot
```

**通过标准**：
- ✅ 显示"字节跳动"的真实官网入口
- ✅ 或显示 3-5 个备选渠道
- ✅ 不是空白页

### F6: 政府看板（从 DB 读取）

```bash
playwright navigate "http://localhost:3030/gov-dashboard"
playwright screenshot
```

**通过标准**：
- ✅ 4 大核心指标显示真实数字（不是 0）
- ✅ 3 个标杆案例完整显示
- ✅ 4 个分布图（年龄/行业/地区/失业时长）
- ✅ 数据从 PostgreSQL 读取（不是 mock）

**关键**：
- ❌ 如果所有数字都是 0 → 还在 fallback mock

### F7: 隐私保护

```bash
playwright navigate "http://localhost:3030/privacy"
playwright screenshot
```

**通过标准**：
- ✅ 4 大原则显示
- ✅ "导出我的数据"按钮可点击
- ✅ "删除所有数据"按钮可点击
- ✅ 5 节详细政策

### F8: AI Provider 配置

```bash
playwright navigate "http://localhost:3030/settings/api"
playwright screenshot
```

**通过标准**：
- ✅ 4 个 Provider 卡片（MiniMax/Claude/DeepSeek/自定义）
- ✅ "测试连接"按钮可点击
- ✅ API Key 字段用 password type

---

## 🐍 Python 爬虫验证

```bash
# 1. 启动爬虫
cd apps/scraper
nohup uv run uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/scraper.log 2>&1 &
sleep 10

# 2. 健康检查
curl -s http://localhost:8000/health | python3 -m json.tool
# 期望：{"status":"ok","version":"0.1.0","scrapling_available":true}

# 3. 测试公司官网爬虫
curl -s -X POST "http://localhost:8000/api/v1/scrape/company-careers?company_name=%E5%AD%97%E8%8A%82%E8%B7%B3%E5%8A%A8" \
  -H "Content-Type: application/json" -d '{}' | python3 -m json.tool

# 4. 测试政府采购网
curl -s -X POST "http://localhost:8000/api/v1/scrape/gov-procurement" \
  -H "Content-Type: application/json" -d '{}' | python3 -m json.tool

# 5. 测试人社局公告
curl -s -X POST "http://localhost:8000/api/v1/scrape/hrss-bulletin" \
  -H "Content-Type: application/json" -d '{}' | python3 -m json.tool
```

**通过标准**：
- ✅ /health 返回 200
- ✅ /docs 返回 200（OpenAPI 文档）
- ✅ 爬虫返回真实数据（不是空数组）
- ✅ 日志显示真实的 HTTP 请求

---

## 🗄️ 数据库验证

```bash
# 1. 列出所有表
psql -d reinvention -c "\dt"

# 2. 验证种子数据
psql -d reinvention -c "SELECT COUNT(*) FROM \"User\";"
psql -d reinvention -c "SELECT COUNT(*) FROM \"GovSuccessCase\";"
psql -d reinvention -c "SELECT COUNT(*) FROM \"GovOpportunity\";"

# 3. 验证数据完整性
psql -d reinvention -c "SELECT \"ageRange\", industry, \"originalSalary\" || 'w → ' || \"newSalary\" || 'w' FROM \"GovSuccessCase\";"

# 4. 验证查询性能（带索引）
psql -d reinvention -c "EXPLAIN SELECT * FROM \"User\" WHERE role = 'USER';"
```

**通过标准**：
- ✅ 14 张表全部存在
- ✅ 种子数据 ≥ 3 条
- ✅ 查询使用索引（无 Seq Scan）

---

## 🤖 AI Provider 验证

```bash
# 1. 真实调用 MiniMax API
curl -s -X POST "https://api.MiniMax.chat/v1/chat/completions" \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"MiniMax-M3","messages":[{"role":"user","content":"hi"}],"max_tokens":10}' \
  | python3 -m json.tool

# 2. 通过 dev server 测试连接
# 在 /settings/api 页面点击"测试连接"
```

**通过标准**：
- ✅ API 返回 200 + 真实内容
- ✅ "测试连接"按钮显示 ✓
- ✅ token 计数 > 0

---

## 📱 移动端验证

```bash
# 1. 切换到移动端视口
playwright viewport 375x812
playwright navigate http://localhost:3030/

# 2. 截图所有页面
for p in / /about /resume/upload /match/jobs /projects /deliver /privacy; do
  playwright navigate "http://localhost:3030$p"
  playwright screenshot "/tmp/mobile-$p.png"
done

# 3. 切换回桌面
playwright viewport 1280x720
```

**通过标准**：
- ✅ 所有页面在 375x812 下正常显示
- ✅ 文字可读（≥ 14px）
- ✅ 按钮可点击（≥ 44px）
- ✅ 无横屏滚动

---

## 🔒 安全验证

```bash
# 1. .env.local 不在 git
git check-ignore apps/web/.env.local
# 期望：apps/web/.env.local（被忽略）

# 2. 检查密钥
grep -r "sk-cp-\|sk-ant-\|sk-" --include="*.ts" --include="*.tsx" apps/ | grep -v "demo\|your_" | head -5
# 期望：无泄漏

# 3. 检查无 .env 提交
git log --all --full-history -- apps/web/.env.local
# 期望：无提交历史
```

**通过标准**：
- ✅ .env.local 被 .gitignore 排除
- ✅ 代码无硬编码密钥
- ✅ .env.local 无 git 历史

---

## ✅ 验证总结

完成所有上述验证后，填写：

```markdown
# 验证报告 [日期]

## 已验证（✓）
- [x] TypeScript 0 错误
- [x] Build 成功
- [x] 所有路由 200
- [x] 真实爬虫抓到数据
- [x] 真实 AI API 返回
- [x] 数据库读写正常
- [x] 移动端布局正常
- [x] 安全检查通过

## 未通过（✗）
- [ ] 单元测试（0 个）
- [ ] E2E 测试（0 个）
- [ ] 端到端流程（未实际跑通）

## 改进建议
1. 增加测试覆盖（5 单元 + 1 E2E）
2. 实际测试 PDF 上传流程
3. 验证 AI 改写不是 fallback
```
