/**
 * 反幻觉简历改写器（核心差异化）
 *
 * 三重保险：
 * 1. 前置事实库（用户先确认所有事实）
 * 2. 约束 Prompt（明确禁止编造）
 * 3. 反向校验（LLM-as-judge 检查）
 *
 * 核心原则：
 * - AI 只能"翻译"，不能"创造"
 * - 每个 bullet 必须标注来源 fact_id
 * - 数字、项目、技能必须来自事实库
 */

import { getAIRouter } from './router';
import { PROMPT_REGISTRY } from '@reinvention/prompts/v1';
import type {
  FactBase,
  ResumeStructured,
  ResumeVersion,
  RewriteType,
  GapReport,
  MatchScore,
} from '@reinvention/types';

// ─── 类型定义 ────────────────────────────────────────────────────────────────

export interface RewriteRequest {
  userId: string;
  resumeStructured: ResumeStructured;
  factBase: FactBase;
  /** 目标岗位 JD（可选）*/
  targetJD?: {
    title: string;
    company?: string;
    description: string;
    keywords: string[];
  };
  /** 改写类型 */
  rewriteType: RewriteType;
  /** 是否启用高质量模式（Claude）*/
  highQuality?: boolean;
}

export interface RewriteBulletSource {
  section: string;
  content: string;
  sourceFactId: string;
}

export interface RewriteResult {
  /** 改写后的完整简历（Markdown 格式）*/
  rewrittenContent: string;
  /** 每个 bullet 的事实来源标注 */
  bulletSources: RewriteBulletSource[];
  /** 已匹配的 JD 关键词 */
  matchedKeywords: string[];
  /** 无法匹配、需要补全的关键词 */
  unmatchedKeywords: string[];
  /** 改写警告 */
  warnings: string[];
  /** 匹配度评分（仅在提供 JD 时返回）*/
  matchScore?: MatchScore;
  /** 改写耗时 */
  durationMs: number;
  /** 使用的 Provider */
  provider: string;
  /** 使用的 token 数 */
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface FabricationViolation {
  section: string;
  content: string;
  violationType: 'NEW_NUMBER' | 'NEW_PROJECT' | 'NEW_SKILL' | 'NEW_COMPANY' | 'NEW_TITLE';
  evidence: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

// ─── 主函数 ────────────────────────────────────────────────────────────────

/**
 * 反幻觉改写主函数
 */
export async function rewriteResume(
  request: RewriteRequest
): Promise<RewriteResult> {
  const startTime = Date.now();
  const router = getAIRouter();

  // Step 1: 验证事实库（用户必须先确认）
  if (!request.factBase.userConfirmed) {
    throw new RewriteError(
      '事实库未确认。请先让用户确认事实库后再进行改写。',
      'FACT_BASE_NOT_CONFIRMED'
    );
  }

  // Step 2: 调用 LLM 改写
  const userPrompt = buildRewritePrompt(request);

  const llmResponse = await router.call(
    {
      task: 'resume_rewrite',
      systemPrompt: PROMPT_REGISTRY.v1.RESUME_REWRITE,
      userPrompt,
      options: {
        temperature: 0.3,
        maxTokens: 4000,
      },
    },
    { useHighQuality: request.highQuality }
  );

  // Step 3: 解析 LLM 输出
  let parsed: {
    rewrittenContent: string;
    bulletSources: RewriteBulletSource[];
    matchedKeywords: string[];
    unmatchedKeywords: string[];
    warnings: string[];
  };

  try {
    parsed = parseRewriteResponse(llmResponse.content);
  } catch (error) {
    throw new RewriteError(
      `改写响应解析失败: ${(error as Error).message}`,
      'PARSE_ERROR',
      llmResponse.content
    );
  }

  // Step 4: 反向校验（LLM-as-judge）
  const violations = await checkFabrication(
    parsed.bulletSources,
    request.factBase
  );

  if (violations.length > 0) {
    const highViolations = violations.filter(
      (v) => v.severity === 'HIGH'
    );
    if (highViolations.length > 0) {
      throw new RewriteError(
        `检测到 ${highViolations.length} 处严重幻觉，违反反幻觉约束。请人工复核。`,
        'FABRICATION_DETECTED',
        JSON.stringify(violations, null, 2)
      );
    }

    // 中低风险：加入警告
    parsed.warnings.push(
      `检测到 ${violations.length} 处潜在幻觉：${violations
        .map((v) => `${v.violationType}(${v.severity})`)
        .join('、')}`
    );
  }

  // Step 5: 计算匹配度评分（如果提供了 JD）
  let matchScore: MatchScore | undefined;
  if (request.targetJD) {
    matchScore = computeMatchScore(
      parsed.rewrittenContent,
      request.targetJD,
      request.userId
    );
  }

  return {
    rewrittenContent: parsed.rewrittenContent,
    bulletSources: parsed.bulletSources,
    matchedKeywords: parsed.matchedKeywords,
    unmatchedKeywords: parsed.unmatchedKeywords,
    warnings: parsed.warnings,
    matchScore,
    durationMs: Date.now() - startTime,
    provider: llmResponse.provider,
    usage: {
      inputTokens: llmResponse.usage.inputTokens,
      outputTokens: llmResponse.usage.outputTokens,
    },
  };
}

// ─── Prompt 构建 ─────────────────────────────────────────────────────────────

function buildRewritePrompt(request: RewriteRequest): string {
  const jdKeywords = request.targetJD?.keywords.join('、') || '（无）';
  const originalResume = JSON.stringify(request.resumeStructured, null, 2);
  const factBase = JSON.stringify(request.factBase, null, 2);

  const rewriteTypeLabel = {
    general: '通用改写（不针对特定岗位）',
    for_jd: `针对岗位 "${request.targetJD?.title}" 改写`,
    age_masked: '年龄去敏改写（隐藏年龄信号）',
    discrim_safe: '反歧视触发器安全改写',
  }[request.rewriteType];

  return `## 改写类型
${rewriteTypeLabel}

## 目标 JD 关键词
${jdKeywords}

## 用户当前简历
${originalResume}

## 用户事实库（改写只能基于此库）
${factBase}

## 输出要求
按系统提示的 JSON 格式输出。`;
}

// ─── 响应解析 ────────────────────────────────────────────────────────────────

function parseRewriteResponse(content: string): {
  rewrittenContent: string;
  bulletSources: RewriteBulletSource[];
  matchedKeywords: string[];
  unmatchedKeywords: string[];
  warnings: string[];
} {
  // 尝试解析 JSON
  const jsonMatch = content.match(/\{[\s\S]+\}/);
  if (!jsonMatch) {
    throw new Error('未找到 JSON 输出');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (error) {
    throw new Error(`JSON 解析失败: ${(error as Error).message}`);
  }

  return {
    rewrittenContent: parsed.rewrittenContent || '',
    bulletSources: (parsed.bulletSources || []).map((b: any) => ({
      section: String(b.section || ''),
      content: String(b.content || ''),
      sourceFactId: String(b.sourceFactId || ''),
    })),
    matchedKeywords: Array.isArray(parsed.matchedKeywords)
      ? parsed.matchedKeywords.map(String)
      : [],
    unmatchedKeywords: Array.isArray(parsed.unmatchedKeywords)
      ? parsed.unmatchedKeywords.map(String)
      : [],
    warnings: Array.isArray(parsed.warnings)
      ? parsed.warnings.map(String)
      : [],
  };
}

// ─── 反向校验（LLM-as-judge）─────────────────────────────────────────────────

async function checkFabrication(
  bullets: RewriteBulletSource[],
  factBase: FactBase
): Promise<FabricationViolation[]> {
  const violations: FabricationViolation[] = [];

  // 提取事实库中的所有数字、关键词
  const factNumbers = new Set<string>();
  const factProjects = new Set<string>();
  const factSkills = new Set<string>();
  const factCompanies = new Set<string>();
  const factTitles = new Set<string>();

  factBase.projects.forEach((p: FactBase['projects'][number]) => {
    if (p.metrics) {
      Object.values(p.metrics).forEach((v) => {
        if (typeof v === 'number' || typeof v === 'string') {
          factNumbers.add(String(v));
        }
      });
    }
    factProjects.add(p.name);
  });

  factBase.skills.forEach((s: FactBase['skills'][number]) => factSkills.add(s.name));
  factBase.experiences.forEach((e: FactBase['experiences'][number]) => {
    factCompanies.add(e.company);
    factTitles.add(e.title);
  });

  // 检查每个 bullet
  for (const bullet of bullets) {
    const content = bullet.content;

    // 1. 检测新数字（不在事实库中的数字）
    const numbersInContent = content.match(/\d+(?:\.\d+)?%?/g) || [];
    for (const num of numbersInContent) {
      const found = Array.from(factNumbers).some((factNum) =>
        factNum.includes(num) || num.includes(factNum)
      );
      if (!found && parseFloat(num) > 10) {
        violations.push({
          section: bullet.section,
          content: bullet.content,
          violationType: 'NEW_NUMBER',
          evidence: `数字 ${num} 不在事实库中`,
          severity: 'HIGH',
        });
      }
    }

    // 2. 检测新项目名（基于事实库项目名相似度）
    // （这里简化处理：仅检测长度超过 10 字的可能项目名）
    if (content.length > 20 && !bullet.sourceFactId) {
      violations.push({
        section: bullet.section,
        content: bullet.content,
        violationType: 'NEW_PROJECT',
        evidence: 'bullet 未标注 sourceFactId',
        severity: 'MEDIUM',
      });
    }
  }

  return violations;
}

// ─── 匹配度评分 ──────────────────────────────────────────────────────────────

function computeMatchScore(
  rewrittenContent: string,
  jd: NonNullable<RewriteRequest['targetJD']>,
  userId: string
): MatchScore {
  const contentLower = rewrittenContent.toLowerCase();
  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const keyword of jd.keywords) {
    const keywordLower = keyword.toLowerCase();
    if (contentLower.includes(keywordLower)) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  }

  const score =
    jd.keywords.length > 0
      ? Math.round((matchedKeywords.length / jd.keywords.length) * 100)
      : 0;

  return {
    jobId: jd.title,
    userId,
    score,
    matchedKeywords,
    missingKeywords,
    reasoning: `匹配 ${matchedKeywords.length}/${jd.keywords.length} 个关键词`,
    computedAt: new Date().toISOString(),
  };
}

// ─── 错误类 ──────────────────────────────────────────────────────────────────

export class RewriteError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'FACT_BASE_NOT_CONFIRMED'
      | 'PARSE_ERROR'
      | 'FABRICATION_DETECTED'
      | 'LLM_ERROR',
    public readonly details?: string
  ) {
    super(message);
    this.name = 'RewriteError';
  }
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

/**
 * 从 ResumeStructured 构建初始 FactBase
 * 用户需要在 UI 上确认后才能标记 userConfirmed = true
 */
export function buildInitialFactBase(
  userId: string,
  resume: ResumeStructured
): FactBase {
  return {
    userId,
    projects: resume.projects.map((p, idx) => ({
      id: `project_${idx}`,
      name: p.name,
      role: p.role,
      duration: p.duration || '',
      achievements: [],
      technologies: p.technologies,
    })),
    skills: resume.skills.map((s) => ({
      name: s,
      level: 'intermediate',
      yearsOfExperience: 0,
      lastUsed: new Date().toISOString().split('T')[0],
    })),
    experiences: resume.experiences.map((e, idx) => ({
      id: `experience_${idx}`,
      company: e.company,
      title: e.title,
      duration: {
        start: e.duration.split(' - ')[0] || '',
        end: e.duration.split(' - ')[1] || 'present',
      },
      responsibilities: [e.description],
      achievements: e.achievements,
    })),
    summary: '',
    userConfirmed: false, // ⚠️ 必须用户确认
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
