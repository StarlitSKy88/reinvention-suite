/**
 * 简历分析结果存储（IndexedDB）
 *
 * 存储完整的 ProcessedResume 结果，包括：
 * - 结构化数据
 * - 脱敏原文
 * - 年龄去敏检测结果
 * - 反歧视检测结果
 */

import Dexie, { type Table } from 'dexie';
import type { ProcessedResume } from '@/lib/resume/processor';

export interface StoredAnalysis {
  id: string; // ProcessedResume.id
  userId: string;
  fileName: string;
  createdAt: string;
  // 完整数据
  data: ProcessedResume;
}

class AnalysisDB extends Dexie {
  analyses!: Table<StoredAnalysis, string>;

  constructor() {
    super('ReinventionAnalysisDB');
    this.version(1).stores({
      analyses: 'id, userId, fileName, createdAt',
    });
  }
}

let _db: AnalysisDB | null = null;

function getDB(): AnalysisDB {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB 仅在浏览器端可用');
  }
  if (!_db) {
    _db = new AnalysisDB();
  }
  return _db;
}

/**
 * 保存分析结果
 */
export async function saveAnalysis(
  result: ProcessedResume
): Promise<void> {
  const db = getDB();
  await db.analyses.put({
    id: result.id,
    userId: result.userId,
    fileName: result.fileName,
    createdAt: result.createdAt,
    data: result,
  });
}

/**
 * 获取分析结果
 */
export async function getAnalysis(
  id: string
): Promise<ProcessedResume | null> {
  const db = getDB();
  const record = await db.analyses.get(id);
  return record ? record.data : null;
}

/**
 * 获取用户所有分析结果
 */
export async function getUserAnalyses(
  userId: string
): Promise<StoredAnalysis[]> {
  const db = getDB();
  return db.analyses.where('userId').equals(userId).reverse().sortBy('createdAt');
}

/**
 * 删除分析结果
 */
export async function deleteAnalysis(id: string): Promise<void> {
  const db = getDB();
  await db.analyses.delete(id);
}

/**
 * 删除用户所有数据（隐私保护）
 */
export async function deleteAllUserData(userId: string): Promise<number> {
  const db = getDB();
  const records = await db.analyses.where('userId').equals(userId).toArray();
  await db.analyses.where('userId').equals(userId).delete();
  return records.length;
}
