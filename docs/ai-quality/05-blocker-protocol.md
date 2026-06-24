# 卡住时的汇报规则

> **目的**：避免 AI 在遇到困难时"硬试"或"假装完成"
> **3 次失败 = 必须停下来汇报**

---

## 🚨 触发条件

满足**任意**一个，立即停止：

1. 同一个错误连续 3 次尝试都失败
2. 不知道该改什么文件
3. 多个工具/库之间相互冲突
4. 等待外部输入（API key、第三方服务）
5. 需要用户做业务决策

---

## 📋 汇报格式

```
## 🚨 汇报 - [任务名]

### 当前进度
- 已完成：X、Y、Z
- 当前在：[具体步骤]
- 卡在：[具体问题]

### 已尝试
1. 尝试 A：[做了什么] → 结果 [失败/部分]
2. 尝试 B：[做了什么] → 结果 [失败/部分]
3. 尝试 C：[做了什么] → 结果 [失败/部分]

### 已排除
- ❌ 方案 P（原因）
- ❌ 方案 Q（原因）

### 建议尝试
- ⏳ 方案 R（依据 + 预期效果）
- ⏳ 方案 S（依据 + 预期效果）

### 需要的输入
- 用户决策点：[具体问题]
- 上下文：[缺失的信息]
```

---

## 📋 实际案例

### ❌ 错误示范

```
我尝试了3次都不行，可能有bug，要不就这样吧。
```

**问题**：
- 没有具体说明尝试了什么
- 没有具体说明失败原因
- "就这样吧"是放弃

### ✅ 正确示范

```
## 🚨 汇报 - 简历 LLM 提取集成

### 当前进度
- 已完成：客户端 PDF 解析、PII 脱敏
- 当前在：第 3 步 LLM 结构化提取
- 卡在：MiniMax API 返回 401 invalid api key

### 已尝试
1. 尝试 A：直接 POST 到 api.minimaxi.chat → 401 invalid api key
2. 尝试 B：尝试 api.MiniMax.chat（大写）→ 200 OK ✓
3. 尝试 C：尝试不同 model 名 abab6.5s-chat → 401
   （注意：之前测试时大写 URL 是工作的，可能是临时网络问题）

### 已排除
- ❌ 改用 Claude（用户没提供 API key）
- ❌ 改用本地 LLM（用户表示不要本地模型）

### 建议尝试
- ⏳ 重新测试大写 URL（api.MiniMax.chat），看是否稳定
- ⏳ 如不稳定，用 Ollama 本地 LLM 作为 fallback
- ⏳ 询问用户 API key 是否正确

### 需要的输入
- 用户决策：API key 是否有效？或是否启用本地 LLM？
```

---

## 🎯 汇报时机

### ✅ 立即汇报（不要硬试）

- 同一个错误 3 次
- 不知道下一步该做什么
- 需要用户做决策

### ⚠️ 可以继续尝试（记录每次结果）

- 不同方案的尝试
- 不同的实现路径
- 不同的工具/库

### ❌ 不需要汇报（自动完成）

- 简单的代码修改
- 文档查询
- 单一明确的错误解决

---

## 🔧 实施到我们项目

### 我们项目的常见卡点

1. **API key 失效** → 立即汇报，询问用户
2. **数据库连接失败** → 尝试 2 种方案后汇报
3. **LLM 输出格式错误** → 重试 + 调整 prompt，3 次后汇报
4. **第三方库冲突** → 报告冲突详情，建议替代方案
5. **需求不清** → 立即汇报，列出可能解读

### 改进流程

在 `apps/web/lib/ai/router.ts` 中加入汇报机制：

```typescript
async function callAI(task: TaskType, input: AIInput): Promise<AIResponse> {
  const errors: AIProviderError[] = [];

  for (const providerName of getProviderChain(task)) {
    try {
      return await callProvider(providerName, task, input);
    } catch (err) {
      errors.push(err);
      logger.error('provider_failed', { provider: providerName, error: err });
      
      // 3 次都失败，向上汇报
      if (errors.length >= 3) {
        await reportBlocker({
          task,
          errors,
          attempts: errors.length,
        });
        throw new AIProviderError('所有 Provider 失败', 'ALL_FAILED', errors);
      }
    }
  }
}
```

---

## 📊 实际使用记录

| 任务 | 尝试次数 | 是否需要汇报 | 解决方式 |
|---|---|---|---|
| 启动 dev server | 2 | ❌ | 端口被占用，切换到 3030 |
| 安装 Prisma | 1 | ❌ | 直接 pnpm add |
| MiniMax API URL | 5 | ✅ | **汇报**：5 种格式测试 |
| Prisma migrate | 1 | ❌ | DATABASE_URL 显式传递 |
| Python curl_cffi | 1 | ❌ | uv pip install 补全 |
| main.py app 定义 | 2 | ⚠️ | 修复函数顺序 |

---

## ✅ 自我检查清单

每次卡住时，回答这 5 个问题：

- [ ] 我尝试了哪 3 种不同方案？
- [ ] 每种方案的具体效果是什么？
- [ ] 哪个文件需要修改？
- [ ] 错误的具体错误信息是什么？
- [ ] 用户能否帮我做决策？

如果 5 个都能答清楚 → 立即汇报（不要硬试）
