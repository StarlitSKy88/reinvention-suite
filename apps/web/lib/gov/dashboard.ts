/**
 * 政府数据看板 - 数据聚合层
 *
 * 当前实现：从 PostgreSQL 读取
 * 历史：早期使用 mock 数据（已迁移到 DB）
 */

import type {
  GovDashboardMetrics,
  GovSuccessCase,
} from '@reinvention/types';
import {
  aggregateDashboardMetricsDB,
  getSuccessCasesDB,
  type DashboardQuery,
} from './dashboard-db';

// Re-export 类型
export type { DashboardQuery } from './dashboard-db';

/**
 * 聚合看板数据
 */
export async function aggregateDashboardMetrics(
  query: DashboardQuery
): Promise<GovDashboardMetrics> {
  return aggregateDashboardMetricsDB(query);
}

/**
 * 获取标杆案例
 */
export async function getSuccessCases(
  query: DashboardQuery
): Promise<GovSuccessCase[]> {
  return getSuccessCasesDB(query);
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
