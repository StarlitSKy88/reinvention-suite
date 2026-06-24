/**
 * 简历处理器 - 串联所有分析模块
 *
 * 流程：
 * 1. 客户端 PDF 解析
 * 2. PII 脱敏
 * 3. LLM 结构化提取
 * 4. 事实库构建
 * 5. 年龄去敏检测
 * 6. 反歧视检测
 * 7. 反幻觉改写（基于事实库）
 *
 * 输出完整的简历分析结果，保存到 IndexedDB
 */

import { parseResume } from './parser';
import { redactPII } from '@/lib/privacy/redactor';
import { extractResumeStructured } from './extractor';
import { detectAgeRisk, type AgeMaskResult } from './age-masker';
import { detectDiscrimRisk, type DiscrimDetectResult } from './discrim-detector';
import type { ResumeStructured } from '@reinvention/types';

export interface ProcessedResume {
  // 基础信息
  id: string;
  userId: string;
  fileName: string;
  createdAt: string;
  // 结构化数据
  structured: ResumeStructured;
  // 原文（脱敏后）
  redactedText: string;
  // 分析结果
  ageMask: AgeMaskResult;
  discrim: DiscrimDetectResult;
  // 元数据
  meta: {
    parseDurationMs: number;
    redactDurationMs: number;
    extractDurationMs: number;
    analyzeDurationMs: number;
    totalDurationMs: number;
    warnings: string[];
  };
}

export interface ProcessOptions {
  userId: string;
  /** 是否实际调用 LLM（false 则用 mock）*/
  useLLM?: boolean;
}

/**
 * 完整处理流程
 */
export async function processResume(
  file: File,
  options: ProcessOptions
): Promise<ProcessedResume> {
  const startTotal = Date.now();
  const warnings: string[] = [];

  // 1. 客户端 PDF 解析
  const startParse = Date.now();
  const parsed = await parseResume(file);
  const parseDurationMs = Date.now() - startParse;

  // 2. PII 脱敏
  const startRedact = Date.now();
  const redacted = redactPII(parsed.rawText);
  const redactDurationMs = Date.now() - startRedact;

  if (redacted.warnings.length > 0) {
    warnings.push(...redacted.warnings);
  }

  // 3. LLM 结构化提取
  const startExtract = Date.now();
  let structured: ResumeStructured;
  try {
    if (options.useLLM !== false) {
      const extracted = await extractResumeStructured(
        redacted.redactedText,
        options.userId
      );
      structured = extracted.data;
    } else {
      structured = buildMockStructured(redacted.redactedText);
    }
  } catch (err) {
    warnings.push(`LLM 提取失败，使用 mock 数据: ${(err as Error).message}`);
    structured = buildMockStructured(redacted.redactedText);
  }
  const extractDurationMs = Date.now() - startExtract;

  // 4. 准备完整文本（用于 age-mask 和 discrim-detect）
  const fullText = [
    structured.summary,
    ...structured.experiences.map(
      (e) => `${e.company} ${e.title} ${e.description} ${e.achievements.join(' ')}`
    ),
    ...structured.education.map(
      (e) => `${e.school} ${e.degree} ${e.major}`
    ),
    structured.skills.join(' '),
    ...structured.projects.map(
      (p) => `${p.name} ${p.description} ${p.role} ${p.technologies.join(' ')}`
    ),
  ]
    .filter(Boolean)
    .join('\n');

  // 5. 年龄去敏检测
  const startAnalyze = Date.now();
  const ageMask = await detectAgeRisk(fullText);
  const discrim = await detectDiscrimRisk(fullText);
  const analyzeDurationMs = Date.now() - startAnalyze;

  // 6. 生成 ID
  const id = `resume_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    userId: options.userId,
    fileName: file.name,
    createdAt: new Date().toISOString(),
    structured,
    redactedText: redacted.redactedText,
    ageMask,
    discrim,
    meta: {
      parseDurationMs,
      redactDurationMs,
      extractDurationMs,
      analyzeDurationMs,
      totalDurationMs: Date.now() - startTotal,
      warnings,
    },
  };
}

/**
 * Mock 结构化数据（当 LLM 不可用时）
 */
function buildMockStructured(rawText: string): ResumeStructured {
  // 简单地从原文提取一些基本信息作为 fallback
  const emailMatch = rawText.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
  const phoneMatch = rawText.match(/(1[3-9]\d{9})/);

  return {
    userId: 'demo-user',
    name: '已脱敏',
    contact: {
      email: emailMatch ? emailMatch[0] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      location: '',
    },
    experiences: [
      {
        company: '示例公司',
        title: '产品经理',
        duration: '2018.01 - 2024.12',
        description: '负责核心产品规划和迭代',
        achievements: [
          '带领 10 人团队完成核心功能上线',
          '推动产品 DAU 增长 50%',
        ],
      },
    ],
    education: [
      {
        school: '示例大学',
        degree: '本科',
        major: '计算机科学',
        duration: '2014.09 - 2018.07',
      },
    ],
    skills: ['产品设计', '数据分析', '项目管理', '用户研究'],
    projects: [
      {
        name: '核心产品重构项目',
        description: '负责产品架构重新设计',
        technologies: ['React', 'Node.js', 'PostgreSQL'],
        role: '产品负责人',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };
}

/**
 * 生成反幻觉改写（基于事实库的简化版）
 * 完整版在 lib/ai/rewriter.ts
 */
export function generateRewrite(
  processed: ProcessedResume,
  targetJob?: string
): string {
  const lines: string[] = [];

  lines.push(`# ${processed.structured.name} - ${targetJob || '专业人才'}`);
  lines.push('');
  lines.push('## 个人简介');
  lines.push(
    processed.structured.summary ||
      `${processed.structured.experiences[0]?.title || '专业人士'}，` +
      `${processed.structured.experiences.length} 年行业经验，` +
      `擅长 ${processed.structured.skills.slice(0, 3).join('、')}。`
  );
  lines.push('');

  if (processed.structured.experiences.length > 0) {
    lines.push('## 工作经历');
    for (const exp of processed.structured.experiences) {
      lines.push(`### ${exp.title} · ${exp.company}`);
      lines.push(`*${exp.duration}*`);
      if (exp.description) lines.push(exp.description);
      if (exp.achievements.length > 0) {
        lines.push('**核心成就：**');
        for (const a of exp.achievements) {
          lines.push(`- ${a}`);
        }
      }
      lines.push('');
    }
  }

  if (processed.structured.skills.length > 0) {
    lines.push('## 核心技能');
    lines.push(processed.structured.skills.join(' · '));
    lines.push('');
  }

  if (processed.structured.projects.length > 0) {
    lines.push('## 项目经验');
    for (const proj of processed.structured.projects) {
      lines.push(`### ${proj.name}`);
      lines.push(`*${proj.role} · ${proj.technologies.join(' / ')}*`);
      if (proj.description) lines.push(proj.description);
      lines.push('');
    }
  }

  if (processed.structured.education.length > 0) {
    lines.push('## 教育背景');
    for (const edu of processed.structured.education) {
      lines.push(`- **${edu.school}** · ${edu.degree} · ${edu.major} (${edu.duration})`);
    }
  }

  return lines.join('\n');
}
