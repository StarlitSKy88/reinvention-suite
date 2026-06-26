/**
 * 差距分析报告
 *
 * 分析用户简历与目标岗位的差距，并给出可执行的优化建议。
 */

import { getAIRouter } from '@/lib/ai';
import { PROMPT_REGISTRY } from '@reinvention/prompts/v1';
import type {
  ResumeStructured,
  FactBase,
  GapReport,
  Suggestion,
} from '@reinvention/types';

export interface GapAnalysisInput {
  userId: string;
  resume: ResumeStructured;
  factBase: FactBase;
  jobTitle: string;
  jobDescription: string;
  jobKeywords: string[];
  highQuality?: boolean;
}

export interface GapAnalysisResult extends GapReport {
  durationMs: number;
}

/**
 * 差距分析主函数
 */
export async function analyzeGap(
  input: GapAnalysisInput
): Promise<GapAnalysisResult> {
  const startTime = Date.now();
  const router = getAIRouter();

  const userPrompt = `## 用户简历
${JSON.stringify(input.resume, null, 2)}

## 目标岗位 JD
${input.jobDescription}

## 目标岗位关键词
${input.jobKeywords.join('、')}

请按系统提示输出严格的 JSON 格式。`;

  const response = await router.call(
    {
      task: 'gap_analysis',
      systemPrompt: PROMPT_REGISTRY.v1.GAP_ANALYSIS,
      userPrompt,
      options: {
        temperature: 0.3,
        maxTokens: 4000,
      },
    },
    { useHighQuality: input.highQuality }
  );

  const parsed = parseGapResponse(response.content, input.userId);

  return {
    ...parsed,
    durationMs: Date.now() - startTime,
  };
}

function parseGapResponse(
  content: string,
  userId: string
): GapReport {
  const jsonMatch = content.match(/\{[\s\S]+\}/);
  if (!jsonMatch) {
    throw new Error('差距分析响应未找到 JSON');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      userId,
      jobId: parsed.title || 'unknown',
      matchScore: Number(parsed.matchScore || 0),
      missingSkills: (parsed.missingSkills || []).map((s: any) => ({
        skill: String(s.skill || s),
        importance: s.importance || 'medium',
      })),
      missingExperience: (parsed.missingExperience || []).map(String),
      optimizationSuggestions: (parsed.optimizationSuggestions || []).map(
        (s: any): Suggestion => ({
          type: s.type || 'narrative',
          priority: s.priority || 'medium',
          title: String(s.title || ''),
          description: String(s.description || ''),
          actionItems: (s.actionItems || []).map(String),
        })
      ),
      rewrittenResume: String(parsed.rewrittenResume || ''),
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`差距分析 JSON 解析失败: ${(error as Error).message}`);
  }
}
