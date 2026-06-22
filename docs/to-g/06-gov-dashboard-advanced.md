# 政府数据看板（高级版）v2.0（Task #12）

> **基础版**：Task #23 已完成（apps/web/app/gov-dashboard）
> **高级版**：本文件描述权限分级 + 数据导出 + 多区域隔离
> **状态**：规划阶段（待开发）

---

## 🎯 高级版 vs 基础版

| 功能 | 基础版（v1）| 高级版（v2）|
|---|---|---|
| 5 大模块 | ✅ | ✅ |
| 4 大核心指标 | ✅ | ✅ |
| 4 个人画像分布 | ✅ | ✅ |
| 标杆案例展示 | ✅ | ✅ |
| 权限分级 | ❌ | ✅ 5 级 |
| 数据导出 PDF/Excel | ❌ | ✅ |
| 多区域数据隔离 | ❌ | ✅ |
| 数据更新推送 | ❌ | ✅ |
| 定制化主题 | ❌ | ✅ |

---

## 🔐 权限分级（5 级）

### 权限矩阵

| 权限 | 街道 | 区县 | 城市 | 省份 | 全国 |
|---|---|---|---|---|---|
| 查看本级数据 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 查看下级汇总 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 导出本级数据 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 标杆案例编辑 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 用户隐私数据 | ❌ | ❌ | ❌ | ❌ | ✅ |
| 数据看板配置 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 用户账号管理 | ❌ | ✅ | ✅ | ✅ | ✅ |

### 权限实现

```typescript
// apps/web/lib/auth/permissions.ts

export enum GovRole {
  STREET_OFFICER = 'street_officer',
  DISTRICT_ADMIN = 'district_admin',
  CITY_ADMIN = 'city_admin',
  PROVINCE_ADMIN = 'province_admin',
  NATIONAL_ADMIN = 'national_admin',
}

export interface GovUser {
  id: string;
  name: string;
  role: GovRole;
  regionCode: string; // 例: 'beijing_chanyang'
  govProgramId?: string;
}

export function canAccess(user: GovUser, resource: string): boolean {
  const roleLevel = {
    [GovRole.STREET_OFFICER]: 1,
    [GovRole.DISTRICT_ADMIN]: 2,
    [GovRole.CITY_ADMIN]: 3,
    [GovRole.PROVINCE_ADMIN]: 4,
    [GovRole.NATIONAL_ADMIN]: 5,
  }[user.role];
  
  const requiredLevel = {
    'view_own': 1,
    'view_subordinates': 2,
    'edit_case': 1,
    'view_user_pii': 5,
    'manage_users': 2,
  }[resource];
  
  return roleLevel >= requiredLevel;
}
```

---

## 📊 数据导出

### PDF 导出（试用报告 / 年度报告）

**实现**：使用 `puppeteer` + `puppeteer-html-to-pdf`
**触发**：领导点击"导出 PDF"按钮
**内容**：
- 完整的看板数据
- 5 大模块的可视化图表
- 标杆案例（含用户授权信息）
- 政府投入产出分析

### Excel 导出（数据明细）

**实现**：使用 `exceljs`
**触发**：领导点击"导出 Excel"按钮
**内容**：
- 所有数据的原始明细
- 支持自定义筛选（时间范围、区域）
- 多个 Sheet：核心指标 / 画像分布 / 标杆案例 / 用户列表

---

## 🌐 多区域数据隔离

### 架构

```
┌──────────────────────────────────────────┐
│  国家级看板（汇总）                       │
│  ├── 数据：所有省份聚合                   │
│  └── 权限：National Admin                 │
├──────────────────────────────────────────┤
│  省级看板（某省）                         │
│  ├── 数据：省内所有城市聚合               │
│  └── 权限：Province Admin                 │
├──────────────────────────────────────────┤
│  城市级看板（某市）                       │
│  ├── 数据：市内所有区县聚合               │
│  └── 权限：City Admin                     │
├──────────────────────────────────────────┤
│  区县级看板（某区）                       │
│  ├── 数据：区内所有街道聚合               │
│  └── 权限：District Admin                 │
├──────────────────────────────────────────┤
│  街道级看板（某街道）                     │
│  ├── 数据：本街道用户                     │
│  └── 权限：Street Officer                 │
└──────────────────────────────────────────┘
```

### 数据库设计

```sql
-- 用户表（含政府角色）
CREATE TABLE gov_users (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,  -- street_officer / district_admin / ...
  region_code VARCHAR(50) NOT NULL,  -- beijing / beijing_chanyang / ...
  gov_program_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 数据表（带 region_code）
CREATE TABLE user_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  region_code VARCHAR(50) NOT NULL,  -- 数据隔离
  properties JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_events_region ON user_events(region_code, created_at);
```

### 数据查询示例

```typescript
// apps/web/lib/gov/queries.ts

export async function getDashboardMetrics(user: GovUser) {
  // 根据用户角色决定查询范围
  const regionFilter = getRegionFilter(user);
  
  const metrics = await db.query(`
    SELECT 
      COUNT(DISTINCT user_id) AS total_users,
      COUNT(DISTINCT CASE WHEN age >= 35 THEN user_id END) AS age_35_plus
    FROM user_events
    WHERE region_code = $1
      AND created_at >= $2
  `, [regionFilter, getStartDate()]);
  
  return metrics;
}

function getRegionFilter(user: GovUser): string {
  // 街道级：本街道
  if (user.role === GovRole.STREET_OFFICER) {
    return user.regionCode; // 例: 'beijing_chanyang_street_01'
  }
  // 区县级：本区
  if (user.role === GovRole.DISTRICT_ADMIN) {
    return user.regionCode; // 例: 'beijing_chanyang'
  }
  // 城市级：本市
  if (user.role === GovRole.CITY_ADMIN) {
    return user.regionCode; // 例: 'beijing'
  }
  // 省级：本省
  if (user.role === GovRole.PROVINCE_ADMIN) {
    return user.regionCode; // 例: 'beijing_province'
  }
  // 国家级：所有
  return '*';
}
```

---

## 📡 数据更新推送

### 实时更新（WebSocket）

```typescript
// apps/web/lib/gov/realtime.ts

export class GovDashboardRealtime {
  private ws: WebSocket;
  
  subscribe(user: GovUser, onUpdate: (data: any) => void) {
    this.ws = new WebSocket(`wss://gov.reinvention.cn/dashboard/${user.regionCode}`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onUpdate(data);
    };
  }
}
```

### 定时推送（邮件 / 短信）

- **日报**：每天早上 8 点发送昨日数据
- **周报**：每周一发送上周数据
- **月报**：每月 1 号发送上月数据 + 标杆案例

---

## 🎨 定制化主题

### 客户白标

每个城市可以定制：
- Logo（替换为城市 Logo）
- 主色调（保持黑底白字红字，但红色可调）
- 标题文案（"XX 市再就业服务报告"）
- 联系信息（领导姓名 + 电话）

### 配置接口

```typescript
interface GovDashboardConfig {
  cityName: string;        // "北京市"
  cityLogo?: string;       // base64 或 URL
  contactPerson: string;   // "张局长"
  contactPhone: string;    // "138-XXXX-XXXX"
  customAccentColor?: string; // "#FF3B30"（默认）
  welcomeMessage?: string;
}
```

---

## 🔧 实施计划（8 周）

| 周 | 任务 |
|---|---|
| W1-W2 | 权限系统设计 + 数据库 Schema |
| W3-W4 | 多区域数据查询 API |
| W5-W6 | PDF 导出 + Excel 导出 |
| W7 | 实时数据推送（WebSocket） |
| W8 | 定制化主题 + 测试 |

---

## 💰 投入估算

| 项目 | 一次性 | 年费 |
|---|---|---|
| 权限系统开发 | ¥5w | - |
| 数据库设计 + 迁移 | ¥3w | - |
| 多区域查询 API | ¥8w | - |
| PDF 导出 | ¥5w | - |
| Excel 导出 | ¥3w | - |
| WebSocket 实时推送 | ¥5w | - |
| 定制化主题 | ¥3w | - |
| 服务器（多区域） | - | ¥20w-50w |
| 维护 | - | ¥10w |
| **总计** | **¥32w** | **¥30w-60w** |

---

## ✅ 当前进度（基础版 Task #23 已完成）

- [x] 5 大模块 ✓
- [x] 4 大核心指标 ✓
- [x] 4 个人画像分布 ✓
- [x] 标杆案例展示 ✓
- [x] 响应式（桌面 + 移动端）✓
- [x] 黑底白字红字点缀设计 ✓
- [ ] 权限分级（5 级）
- [ ] 数据导出（PDF + Excel）
- [ ] 多区域数据隔离
- [ ] 实时数据推送
- [ ] 定制化主题

**基础版已可用**，高级版按需开发。
