/**
 * IndexedDB Schema via Dexie.js
 *
 * 设计原则：
 * 1. 简历原文只存在客户端，永不上传
 * 2. 服务端只存用户元数据和脱敏后的结构化数据
 * 3. 所有用户数据，用户可一键删除
 */

import Dexie, { type Table } from 'dexie';

/**
 * 简历结构化数据（从 LLM 提取后）
 */
export interface ResumeStructured {
  id?: number;
  userId: string;
  // 基础信息
  name: string; // 已脱敏
  contact: {
    email: string; // 已脱敏
    phone: string; // 已脱敏
    location: string;
  };
  // 工作经历
  experiences: Array<{
    company: string;
    title: string;
    duration: string;
    description: string;
    achievements: string[];
  }>;
  // 教育经历
  education: Array<{
    school: string;
    degree: string;
    major: string;
    duration: string;
  }>;
  // 技能
  skills: string[];
  // 项目经验
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    role: string;
  }>;
  // 元数据
  createdAt: number;
  updatedAt: number;
  version: number; // 用于版本管理
}

/**
 * 简历原文（敏感，存储在客户端）
 * ⚠️ 永远不上传
 */
export interface ResumeOriginal {
  id?: number;
  userId: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'doc';
  rawText: string;
  fileBlob?: Blob; // 原文件，可选
  createdAt: number;
}

/**
 * 简历改写版本（反幻觉改写后的多个版本）
 */
export interface ResumeVersion {
  id?: number;
  userId: string;
  resumeId: number;
  // 改写元数据
  targetJobId?: string; // 针对哪个岗位改写
  targetCompany?: string;
  rewriteType: 'general' | 'for_jd' | 'age_masked' | 'discrim_safe';
  // 改写后内容
  content: string;
  // 事实来源标注（反幻觉保险）
  factSources: Array<{
    section: string;
    content: string;
    sourceFactId: string;
  }>;
  // 评估
  matchScore?: number; // 0-100
  ageMaskApplied: boolean;
  discrimCheckPassed: boolean;
  // 用户反馈
  userAccepted?: boolean;
  createdAt: number;
}

/**
 * 用户事实库（反幻觉核心）
 * 所有改写只能基于此库
 */
export interface FactBase {
  id?: number;
  userId: string;
  // 项目事实
  projects: Array<{
    id: string;
    name: string;
    role: string;
    duration: string;
    achievements: string[];
    technologies: string[];
    metrics?: Record<string, string | number>; // 真实数字
  }>;
  // 技能事实
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience: number;
    lastUsed: string; // ISO date
  }>;
  // 工作经历事实
  experiences: Array<{
    id: string;
    company: string;
    title: string;
    duration: { start: string; end: string | 'present' };
    responsibilities: string[];
    achievements: string[];
    teamSize?: number;
  }>;
  // 自我描述事实
  summary: string;
  // 用户确认
  userConfirmed: boolean;
  confirmedAt?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * 用户设置和画像
 */
export interface UserProfile {
  id?: string; // userId 作为主键
  // 求职目标
  targetJobs: string[];
  targetSalary: { min: number; max: number; currency: string };
  targetLocations: string[];
  targetIndustries: string[];
  // 35+ 转型特有
  ageRange?: string; // 用户主动选择（用于年龄去敏强度）
  willingToRelocate: boolean;
  remotePreferred: boolean;
  // 隐私设置
  privacyLevel: 'strict' | 'normal' | 'open';
  // 政府项目标识
  govProgramId?: string; // 加入的政府再就业项目 ID
  // 时间戳
  createdAt: number;
  updatedAt: number;
}

/**
 * 项目孵化器进度
 */
export interface ProjectIncubation {
  id?: number;
  userId: string;
  // 项目模板
  templateId: string;
  templateName: string;
  // 状态
  status: 'planning' | 'in_progress' | 'completed' | 'abandoned';
  // 进度
  milestones: Array<{
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
    completedAt?: number;
  }>;
  // 产出
  deliverables: Array<{
    type: 'github_repo' | 'article' | 'mvp' | 'research' | 'community';
    url?: string;
    title: string;
    description: string;
  }>;
  // 简历描述（完成后生成）
  resumeDescription?: string;
  startedAt: number;
  completedAt?: number;
}

/**
 * Reinvention IndexedDB Database
 */
export class ReinventionDB extends Dexie {
  resumesStructured!: Table<ResumeStructured, number>;
  resumesOriginal!: Table<ResumeOriginal, number>;
  resumeVersions!: Table<ResumeVersion, number>;
  factBases!: Table<FactBase, number>;
  userProfiles!: Table<UserProfile, string>;
  projectIncubations!: Table<ProjectIncubation, number>;

  constructor() {
    super('ReinventionDB');

    // Schema 版本管理
    this.version(1).stores({
      resumesStructured: '++id, userId, version, createdAt, updatedAt',
      resumesOriginal: '++id, userId, createdAt',
      resumeVersions:
        '++id, userId, resumeId, targetJobId, rewriteType, createdAt',
      factBases: '++id, userId, userConfirmed, createdAt, updatedAt',
      userProfiles: 'id, createdAt, updatedAt',
      projectIncubations: '++id, userId, templateId, status, startedAt',
    });
  }

  /**
   * 一键清空所有用户数据（隐私保护）
   */
  async clearAllUserData(userId: string): Promise<void> {
    await this.transaction(
      'rw',
      [
        this.resumesStructured,
        this.resumesOriginal,
        this.resumeVersions,
        this.factBases,
        this.userProfiles,
        this.projectIncubations,
      ],
      async () => {
        await this.resumesStructured.where('userId').equals(userId).delete();
        await this.resumesOriginal.where('userId').equals(userId).delete();
        await this.resumeVersions.where('userId').equals(userId).delete();
        await this.factBases.where('userId').equals(userId).delete();
        await this.userProfiles.delete(userId);
        await this.projectIncubations
          .where('userId')
          .equals(userId)
          .delete();
      }
    );
  }
}

// 单例导出
let _db: ReinventionDB | null = null;

export function getDB(): ReinventionDB {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB 仅在浏览器端可用');
  }
  if (!_db) {
    _db = new ReinventionDB();
  }
  return _db;
}
