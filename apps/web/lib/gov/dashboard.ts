/**
 * 政府数据看板 - 数据聚合层
 *
 * 从 PostgreSQL 读取埋点数据，聚合为政府可读的看板数据。
 *
 * 5 大模块：
 * 1. 核心指标：覆盖率、活跃度、成功率
 * 2. 效率提升：求职周期、面试次数、简历通过率
 * 3. 用户画像：年龄/行业/地区/失业时长
 * 4. 标杆案例：5-10 个深度成功故事
 * 5. 实时数据：当日活跃、入职转化
 */

import type {
  GovDashboardMetrics,
  GovSuccessCase,
} from '@reinvention/types';

export interface DashboardQuery {
  /** 权限级别（街道/区县/市/省）*/
  scope: 'street' | 'district' | 'city' | 'province' | 'national';
  /** 区域代码 */
  regionCode?: string;
  /** 时间范围 */
  period?: {
    start: Date;
    end: Date;
  };
  /** 政府项目 ID（可选）*/
  govProgramId?: string;
}

/**
 * 聚合看板数据
 *
 * 注意：当前 MVP 阶段使用 mock 数据，生产环境从 PostgreSQL 读取
 */
export async function aggregateDashboardMetrics(
  query: DashboardQuery
): Promise<GovDashboardMetrics> {
  // TODO: 从 PostgreSQL 读取真实数据
  // 当前返回 mock 数据用于演示
  return getMockMetrics(query);
}

/**
 * 获取标杆案例
 */
export async function getSuccessCases(
  query: DashboardQuery
): Promise<GovSuccessCase[]> {
  // TODO: 从 PostgreSQL 读取
  return getMockSuccessCases(query);
}

/**
 * 导出看板数据（Excel / PDF）
 */
export async function exportDashboardData(
  query: DashboardQuery,
  format: 'excel' | 'pdf'
): Promise<Buffer> {
  // TODO: 实现 Excel/PDF 导出
  // 推荐库：exceljs (Excel), pdfkit (PDF)
  throw new Error('Not implemented yet');
}

// ─── Mock 数据（仅用于 MVP 演示）─────────────────────────────────────────────

function getMockMetrics(query: DashboardQuery): GovDashboardMetrics {
  const period = {
    start: query.period?.start?.toISOString() || '2026-01-01',
    end: query.period?.end?.toISOString() || '2026-12-31',
  };

  return {
    period: { start: period.start, end: period.end },
    serviceCoverage: {
      totalUsers: 12_580,
      ageAbove35Ratio: 0.87,
      newUsersThisMonth: 1_240,
    },
    activity: {
      monthlyActiveUsers: 3_842,
      retentionRate: 0.42,
    },
    serviceDepth: {
      resumeUploads: 18_240,
      resumeRewrites: 12_580,
      jobMatches: 45_200,
      projectIncubations: 1_840,
    },
    successRate: {
      totalJobSeekers: 8_240,
      successfulReemployment: 2_156,
      reemploymentRate: 0.262,
      averageJobSearchDays: 124, // 平均求职 4.2 个月
    },
    satisfaction: {
      npsScore: 68,
      positiveRate: 0.85,
    },
    userDemographics: {
      ageDistribution: {
        '35-40': 0.45,
        '40-45': 0.32,
        '45-50': 0.16,
        '50+': 0.07,
      },
      industryDistribution: {
        互联网: 0.32,
        制造业: 0.18,
        金融: 0.12,
        教育: 0.10,
        零售: 0.08,
        其他: 0.20,
      },
      regionDistribution: {
        北京: 0.22,
        上海: 0.18,
        深圳: 0.15,
        广州: 0.12,
        成都: 0.08,
        杭州: 0.07,
        其他: 0.18,
      },
      unemploymentDurationDistribution: {
        '3个月内': 0.22,
        '3-6个月': 0.35,
        '6-12个月': 0.28,
        '12个月以上': 0.15,
      },
    },
  };
}

function getMockSuccessCases(query: DashboardQuery): GovSuccessCase[] {
  return [
    {
      id: 'case-001',
      userId: 'anonymized_xxx',
      ageRange: '40-45',
      industry: '互联网',
      unemploymentMonths: 8,
      targetJob: 'AI 产品经理',
      originalSalary: 50,
      newSalary: 95,
      storyNarrative:
        '张女士，42 岁，原某互联网大厂运营经理。被裁后 8 个月找不到合适工作，通过"再出发"完成：1）简历年龄去敏；2）启动"AI 产品经理"转型项目（开源 + 写作）；3）匹配到 12 家 AI 公司，3 个月内拿到 2 个 offer。最终选择某 AI 创业公司，年薪从 50w 涨到 95w。',
      permissionGranted: true,
      createdAt: '2026-04-15T00:00:00Z',
    },
    {
      id: 'case-002',
      userId: 'anonymized_yyy',
      ageRange: '45-50',
      industry: '制造业',
      unemploymentMonths: 14,
      targetJob: '解决方案专家',
      originalSalary: 35,
      newSalary: 65,
      storyNarrative:
        '王先生，48 岁，原制造业 IT 负责人。被裁 14 个月，通过"再出发"完成：1）简历反歧视改写；2）匹配长三角制造业解决方案岗位；3）入职某德国制造业中国区，年薪从 35w 涨到 65w。',
      permissionGranted: true,
      createdAt: '2026-05-20T00:00:00Z',
    },
    {
      id: 'case-003',
      userId: 'anonymized_zzz',
      ageRange: '35-40',
      industry: '金融',
      unemploymentMonths: 5,
      targetJob: '风控产品经理',
      originalSalary: 60,
      newSalary: 88,
      storyNarrative:
        '李女士，38 岁，原银行风控产品经理。5 个月找到某互联网金融公司，年薪从 60w 涨到 88w。',
      permissionGranted: true,
      createdAt: '2026-06-01T00:00:00Z',
    },
  ];
}
