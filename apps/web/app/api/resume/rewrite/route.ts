/**
 * 反幻觉改写 API
 *
 * POST /api/resume/rewrite
 * Body: {
 *   structured: ResumeStructured,
 *   userId: string,
 *   targetJob?: { title, company?, description, keywords },
 *   rewriteType: 'general' | 'age_masked' | 'discrim_safe'
 * }
 *
 * 策略：
 * 1. 优先尝试 LLM 改写（真实 AI 体验）
 * 2. 失败时 fallback 到基于事实库的纯算法改写（保证可用）
 *
 * 核心：反幻觉（不编造新内容，只重组事实库）
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rewriteResume, buildInitialFactBase } from '@/lib/ai/rewriter';
import type { ResumeStructured, FactBase, RewriteType } from '@reinvention/types';

const RewriteRequestSchema = z.object({
  userId: z.string().default('demo-user'),
  structured: z.any(),
  targetJob: z
    .object({
      title: z.string(),
      company: z.string().optional(),
      description: z.string().optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
  rewriteType: z
    .enum(['general', 'age_masked', 'discrim_safe'])
    .default('general'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params = RewriteRequestSchema.parse(body);

    // 1. 构建事实库
    const factBase = buildInitialFactBase(
      params.userId,
      params.structured as ResumeStructured
    );
    factBase.userConfirmed = true;
    factBase.confirmedAt = Date.now();

    // 2. 尝试 LLM 改写
    try {
      const result = await rewriteResume({
        userId: params.userId,
        resumeStructured: params.structured as ResumeStructured,
        factBase,
        targetJD: params.targetJob
          ? {
              title: params.targetJob.title,
              company: params.targetJob.company ?? '',
              description: params.targetJob.description ?? '',
              keywords: params.targetJob.keywords ?? [],
            }
          : undefined,
        rewriteType: params.rewriteType as RewriteType,
      });

      return NextResponse.json({
        success: true,
        source: 'llm',
        rewrite: {
          content: result.rewrittenContent,
          bulletSources: result.bulletSources,
          matchedKeywords: result.matchedKeywords,
          unmatchedKeywords: result.unmatchedKeywords,
          matchScore: result.matchScore,
          warnings: result.warnings,
        },
      });
    } catch (llmError) {
      // LLM 失败时 fallback 到纯算法改写
      console.warn('LLM 改写失败，使用算法改写:', llmError);

      const fallbackRewrite = algorithmRewrite(
        params.structured,
        factBase,
        params.targetJob,
        params.rewriteType
      );

      return NextResponse.json({
        success: true,
        source: 'algorithm-fallback',
        rewrite: fallbackRewrite,
      });
    }
  } catch (error) {
    console.error('改写失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '改写失败',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * 算法改写 fallback
 * 直接基于事实库生成结构化改写
 */
function algorithmRewrite(
  structured: any,
  factBase: FactBase,
  targetJob: any,
  rewriteType: string
) {
  // 1. 改写工作经历（按时间倒序 + 突出目标岗位技能）
  const experiences = (structured.experiences || [])
    .map((e: any) => ({
      ...e,
      achievements: (e.achievements || []).filter(
        (a: string) => a && a.length > 0
      ),
    }))
    .filter((e: any) => e.title && e.company);

  // 2. 年龄去敏（如果需要）
  let processedExperiences = experiences;
  if (rewriteType === 'age_masked') {
    processedExperiences = experiences.map((e: any) => ({
      ...e,
      duration: e.duration
        ?.replace(/\b(19|20)\d{2}\b/g, 'XXXX')
        ?.replace(/\b\d{2}\s*年\s*经验\b/g, '多年经验'),
    }));
  }

  // 3. 反歧视改写（如果需要）
  if (rewriteType === 'discrim_safe') {
    processedExperiences = processedExperiences.map((e: any) => ({
      ...e,
      description: e.description
        ?.replace(/管理\s*\d{2,}\s*人/g, '管理扁平化团队')
        ?.replace(/\d+\s*人\s*团队/g, '核心团队'),
      achievements: (e.achievements || []).map((a: string) =>
        a.replace(/管理\s*\d{2,}\s*人/g, '管理扁平化团队')
      ),
    }));
  }

  // 4. 突出目标岗位关键词
  const targetKeywords = targetJob?.keywords || [];
  const highlightedSkills = (structured.skills || []).map((s: string) => ({
    skill: s,
    matched: targetKeywords.some((tk: string) =>
      s.toLowerCase().includes(tk.toLowerCase()) ||
      tk.toLowerCase().includes(s.toLowerCase())
    ),
  }));

  // 5. 生成 Markdown 格式改写
  const content = generateMarkdown(
    structured,
    processedExperiences,
    highlightedSkills,
    targetJob,
    rewriteType
  );

  // 6. 计算匹配分（基于真实数据）
  const matchedKeywords = targetKeywords.filter((tk: string) =>
    highlightedSkills.some(
      (h: any) => h.matched && h.skill.toLowerCase() === tk.toLowerCase()
    )
  );
  const matchScore =
    targetKeywords.length > 0
      ? Math.round((matchedKeywords.length / targetKeywords.length) * 100)
      : 0;

  // 7. 每个 bullet 标注事实来源
  const bulletSources = processedExperiences.flatMap(
    (e: any, expIdx: number) =>
      (e.achievements || []).map((a: string, achIdx: number) => ({
        section: `${e.company} - ${e.title}`,
        content: a,
        sourceFactId: `experience_${expIdx}_achievement_${achIdx}`,
      }))
  );

  return {
    content,
    bulletSources,
    matchedKeywords,
    unmatchedKeywords: targetKeywords.filter(
      (tk: string) => !matchedKeywords.includes(tk)
    ),
    matchScore: {
      jobId: targetJob?.title || 'unknown',
      userId: 'demo-user',
      score: matchScore,
      matchedKeywords,
      missingKeywords: targetKeywords.filter(
        (tk: string) => !matchedKeywords.includes(tk)
      ),
      reasoning: `基于事实库的纯算法改写：${matchedKeywords.length}/${targetKeywords.length} 个目标关键词匹配`,
      computedAt: new Date().toISOString(),
    },
    warnings: [
      '使用算法 fallback 改写（LLM 不可用时）',
      '反幻觉保证：仅重组事实库内容，不编造新数据',
    ],
  };
}

/**
 * 生成 Markdown 格式的简历
 */
function generateMarkdown(
  structured: any,
  experiences: any[],
  highlightedSkills: any[],
  targetJob: any,
  rewriteType: string
): string {
  const lines: string[] = [];

  lines.push(`# ${structured.name || '专业人才'}`);
  if (targetJob) {
    lines.push(`## 应聘：${targetJob.title}${targetJob.company ? ` @ ${targetJob.company}` : ''}`);
  }
  lines.push('');

  if (structured.summary) {
    lines.push('## 个人简介');
    lines.push(structured.summary);
    lines.push('');
  }

  if (experiences.length > 0) {
    lines.push('## 工作经历');
    for (const exp of experiences) {
      lines.push(`### ${exp.title} · ${exp.company}`);
      if (exp.duration) lines.push(`*${exp.duration}*`);
      if (exp.description) lines.push(exp.description);
      if (exp.achievements?.length > 0) {
        lines.push('');
        lines.push('**核心成就：**');
        for (const a of exp.achievements) {
          lines.push(`- ${a}`);
        }
      }
      lines.push('');
    }
  }

  if (highlightedSkills.length > 0) {
    lines.push('## 核心技能');
    for (const h of highlightedSkills) {
      const marker = h.matched ? ' ⭐' : '';
      lines.push(`- ${h.skill}${marker}`);
    }
    lines.push('');
  }

  if (structured.education?.length > 0) {
    lines.push('## 教育背景');
    for (const edu of structured.education) {
      lines.push(`- **${edu.school}** · ${edu.degree || ''} · ${edu.major || ''} (${edu.duration || ''})`);
    }
    lines.push('');
  }

  if (rewriteType === 'age_masked') {
    lines.push('---');
    lines.push('*已应用年龄去敏改写*');
    lines.push('');
  }

  if (rewriteType === 'discrim_safe') {
    lines.push('---');
    lines.push('*已应用反歧视触发器改写*');
    lines.push('');
  }

  return lines.join('\n');
}
