# Reinvention Suite — 数据库设计文档

> **数据库**：PostgreSQL 16
> **ORM**：Prisma 5.x
> **位置**：`apps/web/prisma/schema.prisma`

---

## 📊 ER 图（核心实体关系）

```
┌──────────────┐       ┌────────────────┐
│    User      │1────∞│    Resume       │
│              │       │  (结构化)       │
└──────────────┘       └────────────────┘
       │1                     │1
       │                      │
       │∞                     ∞
┌──────────────┐       ┌────────────────┐
│ ResumeVersion│       │   FactBase     │
│  (改写版本)   │       │   (反幻觉)      │
└──────────────┘       └────────────────┘

┌──────────────┐       ┌────────────────┐
│    Match     │∞────1│  JobPosting    │
│  (用户匹配)   │       │    (岗位)      │
└──────────────┘       └────────────────┘
       │
       │1
       │
       ∞
┌──────────────┐
│  GapReport   │
│   (差距)     │
└──────────────┘

┌──────────────┐       ┌────────────────┐
│ ProjectIncub │       │GovSuccessCase  │
│  (项目孵化)   │       │   (标杆案例)    │
└──────────────┘       └────────────────┘

┌──────────────┐       ┌────────────────┐
│GovOpportunity│       │AnalyticsEvent  │
│   (机会发现)  │       │   (行为埋点)    │
└──────────────┘       └────────────────┘

┌──────────────┐       ┌────────────────┐
│ ApiKeyConfig │       │   AuditLog     │
│  (API Key)   │       │   (审计)        │
└──────────────┘       └────────────────┘
```

---

## 📋 核心表详解

### User（用户表）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String | CUID 主键 |
| email | String? | 唯一索引 |
| phone | String? | 索引 |
| wechatOpenId | String? | 微信登录 |
| role | UserRole | 6 个角色（RBAC） |
| regionCode | String? | 地区代码（用于政府看板权限）|
| govProgramId | String? | 加入的政府再就业项目 ID |

**索引**：`role`, `regionCode`, `govProgramId`

### Resume（简历表）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | String | CUID |
| userId | String | 所属用户 |
| name / email / phone | String | 已脱敏 |
| experiences | Json | 工作经历（JSON） |
| education | Json | 教育 |
| skills | String[] | 技能标签 |
| projects | Json | 项目经验 |
| rawTextHash | String? | 原始文本哈希（去重）|

**关联**：`User`, `ResumeVersion[]`

### ResumeVersion（改写版本）

记录每次反幻觉改写的输出，支持：
- 针对不同 JD 改写（FOR_JD）
- 年龄去敏改写（AGE_MASKED）
- 反歧视触发器安全（DISCRIM_SAFE）
- 用户是否采纳

### FactBase（事实库）

反幻觉核心，**用户在改写前必须确认所有事实**：
- 项目事实（id, name, role, duration, achievements, metrics）
- 技能事实（level, yearsOfExperience, lastUsed）
- 工作经历事实（responsibilities, achievements, teamSize）
- `userConfirmed: Boolean` — 是否已确认

### JobPosting（岗位）

支持多源：
- 公司官网（COMPANY_WEBSITE）
- Boss 直聘（BOSS_ZHIPIN）
- 拉勾（LAGOU）
- 猎聘（LIEPIN）
- LinkedIn
- Exa 搜索
- 中国政府采购网（CCGP）
- 人社局公告（HRSS_BULLETIN）

**唯一约束**：`(source, sourceUrl)` — 同源同 URL 不重复

### Match（匹配）

`(userId, jobId)` 唯一，记录每个用户对每个岗位的匹配分。

### GapReport（差距报告）

每次差距分析的结果，包含：
- 缺失技能
- 缺失经验
- 5 条优化建议
- 改写后简历

### ProjectIncubation（项目孵化）

10 个项目模板（OSS、写作、MVP 等）的进度跟踪。

### GovSuccessCase（标杆案例）

**已脱敏**，展示给政府领导看：
- 年龄段（不是具体年龄）
- 行业（泛化）
- 失业时长
- 薪资对比
- 完整故事

### GovOpportunity（政府采购机会）

爬虫发现的 To-G 合作机会，**6 维度评分**：
- keywordScore / budgetScore / freshnessScore
- regionScore / buyerTypeScore / competitionScore
- totalScore（加权总分）
- recommendation：high / medium / low
- status：NEW / CONTACTED / PROPOSAL_SENT / NEGOTIATING / WON / LOST

### AnalyticsEvent（行为埋点）

17 类事件：
- user_register / user_login
- resume_upload / resume_parse / resume_rewrite
- age_mask_detect / discrim_detect
- job_match / gap_analysis
- project_start / project_complete
- delivery_navigate / success_report
- gov_program_join / page_view / feature_use / feedback

`anonymousUserId`（脱敏后用户 ID），不含 PII。

### AuditLog（审计日志）

**所有 API 调用、所有数据修改、所有登录登出**记录：
- userId, action, resource, resourceId
- ipAddress, userAgent
- metadata, status, errorMessage

**留存 7 年**（合规要求）。

### ApiKeyConfig（API Key 配置）

用户自配置的 AI Provider Key：
- provider（minimax / claude / deepseek / custom）
- `encryptedKey` — **AES-256-GCM 加密存储**
- `keyMask` — 显示用（仅后 4 位）
- baseUrl, model, highQualityOnly
- lastTestedAt, lastTestResult
- totalCalls, totalTokens, totalCost

---

## 🚀 迁移命令

### 初始化数据库

```bash
cd apps/web

# 1. 生成 Prisma Client
pnpm prisma generate

# 2. 创建初始迁移
pnpm prisma migrate dev --name init

# 3. 导入种子数据
pnpm prisma db seed
```

### 生产环境

```bash
# 部署迁移（不重置数据）
pnpm prisma migrate deploy

# 种子数据（仅首次部署）
pnpm prisma db seed
```

### 重置数据库（开发环境）

```bash
# ⚠️ 会删除所有数据
pnpm prisma migrate reset
```

---

## 📊 索引策略

```prisma
// 高频查询字段都加索引
@@index([userId])        // 用户查询
@@index([regionCode])    // 地区筛选
@@index([govProgramId])  // 政府项目
@@index([createdAt])      // 时间排序
@@index([totalScore])     // 评分排序

// 复合索引
@@unique([userId, jobId])        // 匹配去重
@@unique([source, sourceUrl])    // 岗位去重
@@unique([userId, provider])     // API Key 去重
```

---

## 🔐 数据安全

### 敏感字段加密

| 字段 | 加密方式 |
|---|---|
| User.email | AES-256-GCM |
| User.phone | AES-256-GCM |
| ApiKeyConfig.encryptedKey | AES-256-GCM |
| Resume.name/email/phone | 脱敏后存储 |

### 字段脱敏

```typescript
// 显示用户邮箱：z***@example.com
mask(email, 1, 0); // 保留 1 位，脱敏后缀

// 显示手机号：138****1234
mask(phone, 3, 4); // 保留前 3 后 4
```

### 访问控制

- 所有 API 必须经过 JWT 鉴权
- RBAC 权限矩阵（lib/auth/rbac.ts）
- PII 字段仅对有权限角色可见

---

## 📈 性能优化建议

### 1. 物化视图（Dashboard）

```sql
CREATE MATERIALIZED VIEW gov_dashboard_daily AS
SELECT 
  DATE(created_at) as date,
  region_code,
  COUNT(DISTINCT user_id) as total_users,
  COUNT(*) FILTER (WHERE type = 'resume_rewrite') as rewrites
FROM analytics_events
GROUP BY 1, 2;

CREATE INDEX ON gov_dashboard_daily(date, region_code);
```

### 2. 缓存策略

- 看板数据：30 分钟缓存（Redis）
- 机会评分：1 小时缓存
- 用户画像：5 分钟缓存

### 3. 分区表

```sql
-- analytics_events 按月分区
CREATE TABLE analytics_events_2026_06 PARTITION OF analytics_events
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
```

---

## 🆘 常见问题

### Q1：迁移失败怎么办？
A：`pnpm prisma migrate reset` 重置数据库（开发环境）。

### Q2：如何添加新字段？
A：
1. 修改 `schema.prisma`
2. `pnpm prisma migrate dev --name add_xxx`
3. 生成新迁移文件
4. 在生产环境运行 `pnpm prisma migrate deploy`

### Q3：如何备份？
A：`docker compose exec db pg_dump -U reinvention reinvention > backup.sql`

### Q4：如何重置 mock 数据？
A：编辑 `prisma/seed.ts` 修改数据，然后 `pnpm prisma db seed`
