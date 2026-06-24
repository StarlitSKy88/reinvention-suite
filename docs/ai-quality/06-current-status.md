# 当前项目 AI 偷懒评估 + 修复计划

> **评估日期**：2026-06-24
> **评估方法**：6 步 SOP + 质量 Rubric
> **结论**：发现 5 个"偷懒"点，2 周内可全部修复

---

## 🔍 当前项目偷懒评估

### 1. 0 个测试文件

**问题**：
- 我们 11 个页面 + 8 个 API + 11 个数据模型，**0 个测试**
- 任何"看起来 OK"都可能是巧合

**证据**：
```bash
$ find apps packages -name '*.test.ts' -o -name '*.spec.ts' | grep -v node_modules | wc -l
0
```

**影响**：
- 改一行代码不知道会破坏什么
- 无法保证功能真的工作
- QA 报告不可信

### 2. 3 处 mock 数据假装工作

**问题 1：MOCK_JOBS** — `/match/jobs` 仍使用 mock 岗位
```typescript
// apps/web/app/match/jobs/page.tsx
const MOCK_JOBS: JobMatch[] = [
  { id: 'mock-1', title: 'AI 产品经理', ... },  // ← 写死
];
```

**问题 2：buildMockStructured** — 简历 LLM 提取失败时静默 fallback
```typescript
// apps/web/lib/resume/processor.ts
} catch (err) {
  warnings.push(`LLM 提取失败，使用 mock 数据`);
  structured = buildMockStructured(...);  // ← 用户无感知
}
```

**问题 3：extractResumeStructured mock** — LLM 不可用时返回 mock
```typescript
// apps/web/lib/resume/extractor.ts
async function extractResumeStructured(...) {
  // ← 实际只调用 LLM，没看到 mock 路径
}
```

**影响**：
- 用户看到"成功"但其实是假数据
- 匹配分是写死的（87/78/72...）
- 简历提取结果不是用户的真实简历

### 3. AI 改写未真正集成

**问题**：
- lib/ai/rewriter.ts 实现了反幻觉改写（200+ 行）
- 但**没有 UI 触发它**
- 用户无法真正使用改写功能

**证据**：
```bash
$ grep -r "rewriteResume" apps/web/app/
# 0 matches
```

**影响**：
- 这是 II "简历优化" 的核心功能
- 实现了但用户用不到

### 4. 端到端流程未真正跑通

**问题**：
- 首页 → 上传 → 分析 → 匹配 → 投递 流程理论上设计好了
- 但没有用真实 PDF 测试过
- 不知道实际会出什么问题

**影响**：
- 可能有"理论上能用但实际有 bug"的情况
- 用户首次使用体验可能是负面的

### 5. README 缺失

**问题**：
- 没有 README.md
- 新开发者不知道如何启动项目
- 部署文档散落在多个文件

**证据**：
```bash
$ ls README.md docs/README.md 2>/dev/null
ls: README.md: No such file or directory
ls: docs/README.md: No such file or directory
```

---

## 🎯 修复计划（按优先级）

### P0：消除 mock（必须修）

| 任务 | 估计时间 | 状态 |
|---|---|---|
| 替换 MOCK_JOBS 为真实数据库读取 | 4h | ⏳ 待开始 |
| 真实调用 LLM，失败时给用户明确错误 | 2h | ⏳ 待开始 |
| 集成 rewriteResume 到 UI（增加"一键改写"按钮） | 6h | ⏳ 待开始 |
| 端到端测试（实际 PDF 文件） | 4h | ⏳ 待开始 |

### P1：补测试（应该修）

| 任务 | 估计时间 | 状态 |
|---|---|---|
| 单元测试：5 个核心函数 | 4h | ⏳ 待开始 |
| E2E 测试：1 个完整流程（Playwright）| 4h | ⏳ 待开始 |
| 设置 CI（GitHub Actions）| 2h | ⏳ 待开始 |

### P2：写文档（应该修）

| 任务 | 估计时间 | 状态 |
|---|---|---|
| README.md（快速开始）| 1h | ⏳ 待开始 |
| 更新部署文档 | 1h | ⏳ 待开始 |
| 架构图（重新画）| 1h | ⏳ 待开始 |

**总估计：28h（约 4 天）**

---

## 🎯 立即可执行的 /goal 任务

### /goal Task 1：消除 MOCK_JOBS

```markdown
# /goal 消除 MOCK_JOBS，使用真实数据库

## 1. 结果标准
- [ ] /match/jobs 从 GovOpportunity DB 读取岗位
- [ ] 用户看到的匹配分是真实计算（基于用户技能 vs 真实岗位）
- [ ] 5 个岗位的匹配分各不相同（不是写死的）
- [ ] TypeScript 0 错误，Build 成功

## 2. 验证方式
- 手动访问 /match/jobs，截图证明 5 个不同分
- 写 SQL 确认 GovOpportunity 表有 5+ 条
- 匹配引擎日志显示真实计算

## 3. 禁区边界
- 不要修改 lib/match/engine.ts
- 不要修改其他页面
- 不要删除 MOCK_JOBS 注释（保留作为 fallback）

## 4. 迭代记录
- 第 1 次：尝试 prisma.govOpportunity.findMany() → 字段不匹配
- 第 2 次：调整字段映射 → 成功获取
- 第 3 次：使用真实匹配引擎 → 5 个不同分

## 5. 卡住时
3 次后汇报：已尝试 + 建议方案
```

### /goal Task 2：集成改写 UI

```markdown
# /goal 集成反幻觉改写到 UI

## 1. 结果标准
- [ ] /resume/analyze 显示"改写后的简历"
- [ ] 每个 bullet 标注 fact_id
- [ ] 用户可采纳或拒绝
- [ ] TypeScript 0 错误

## 2. 验证方式
- 上传 mock PDF → 看到改写后的简历
- 验证 factSources 字段存在
- 截图证明 UI 显示

## 3. 禁区边界
- 不要修改 lib/ai/rewriter.ts
- 不要修改其他页面
- 不要让 AI 编造内容

## 4. 迭代记录
- ...

## 5. 卡住时
...
```

---

## 📊 改进后的质量评分预期

| 维度 | 当前 | 目标 | 改进 |
|---|---|---|---|
| 代码质量 | 24/30 | 28/30 | +4（错误处理） |
| 功能完整性 | 18/30 | 27/30 | +9（消除 mock + 真实流程） |
| UI / UX | 17/20 | 18/20 | +1（移动端测试） |
| 可测试性 + 文档 | 3/20 | 15/20 | +12（测试 + 文档） |
| **总分** | **62/100** | **88/100** | **+26** |

**目标**：从 62 → 88（合格线 80，优秀线 90）

---

## 🚀 立即启动

按以下顺序执行：

1. **Task 1**：消除 MOCK_JOBS（4h）
2. **Task 2**：集成改写 UI（6h）
3. **Task 3**：端到端测试（4h）
4. **Task 4**：5 单元测试（4h）
5. **Task 5**：1 E2E 测试（4h）
6. **Task 6**：README + CI（4h）

**总时间**：26h
**预计完成**：2 周内

---

## 📝 自我检查（每天结束时）

问自己：
- [ ] 我今天有没有用 mock 假装工作？
- [ ] 我今天有没有跳过错误处理？
- [ ] 我今天有没有在卡住时硬试？
- [ ] 我今天有没有更新测试？
- [ ] 我今天有没有更新文档？
