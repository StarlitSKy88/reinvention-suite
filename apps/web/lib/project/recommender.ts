/**
 * 项目孵化器 - AI 推荐引擎
 *
 * 基于用户画像（当前简历 + 目标岗位）推荐最合适的项目方案。
 */

import { getAIRouter } from '@/lib/ai';
import { PROMPT_REGISTRY } from '@reinvention/prompts/v1';
import { recommendProjects, PROJECT_TEMPLATES } from './templates';
import type {
  ProjectTemplate,
  ResumeStructured,
  FactBase,
} from '@reinvention/types';

export interface ProjectRecommendationInput {
  userId: string;
  resume: ResumeStructured;
  factBase: FactBase;
  targetJob: string;
  targetJD?: string;
  /** 用户能力差距（可选）*/
  skillGaps?: string[];
  /** 是否使用 LLM 增强推荐 */
  useLLM?: boolean;
}

export interface ProjectRecommendation {
  templates: ProjectTemplate[];
  aiRecommendations?: Array<{
    template: ProjectTemplate;
    reasoning: string;
    customization: string;
  }>;
  totalAvailable: number;
}

/**
 * 推荐项目模板
 */
export async function recommendProjectsForUser(
  input: ProjectRecommendationInput
): Promise<ProjectRecommendation> {
  // Step 1: 规则引擎快速推荐
  const ruleBased = recommendProjects(
    input.targetJob,
    input.resume.skills,
    5
  );

  // Step 2: LLM 增强推荐（可选）
  let aiRecommendations:
    | Array<{
        template: ProjectTemplate;
        reasoning: string;
        customization: string;
      }>
    | undefined;

  if (input.useLLM !== false) {
    try {
      aiRecommendations = await llmEnhancedRecommend(input, ruleBased);
    } catch {
      // LLM 失败不影响主流程
    }
  }

  return {
    templates: ruleBased,
    aiRecommendations,
    totalAvailable: PROJECT_TEMPLATES.length,
  };
}

async function llmEnhancedRecommend(
  input: ProjectRecommendationInput,
  ruleBased: ProjectTemplate[]
): Promise<
  Array<{
    template: ProjectTemplate;
    reasoning: string;
    customization: string;
  }>
> {
  const router = getAIRouter();

  const userPrompt = `## 用户当前简历
${JSON.stringify(input.resume, null, 2)}

## 目标岗位
${input.targetJob}

${
  input.targetJD
    ? `## 目标 JD
${input.targetJD}`
    : ''
}

${
  input.skillGaps && input.skillGaps.length > 0
    ? `## 用户能力差距
${input.skillGaps.join('、')}`
    : ''
}

## 候选项目模板（已基于规则推荐）
${ruleBased
  .map(
    (t) =>
      `- ${t.name}（${t.durationWeeks} 周，${t.difficulty}）: ${t.description}`
  )
  .join('\n')}

请从候选项目中精选 3 个最适合的，并针对用户的具体情况给出定制化建议。`;

  const response = await router.call({
    task: 'project_recommend',
    systemPrompt: PROMPT_REGISTRY.v1.PROJECT_RECOMMEND,
    userPrompt,
    options: {
      temperature: 0.4,
      maxTokens: 3000,
    },
  });

  return parseProjectRecommendations(response.content, ruleBased);
}

function parseProjectRecommendations(
  content: string,
  ruleBased: ProjectTemplate[]
): Array<{
  template: ProjectTemplate;
  reasoning: string;
  customization: string;
}> {
  const jsonMatch = content.match(/\{[\s\S]+\}/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const recommendations = parsed.recommendations || [];

    return recommendations
      .map((rec: any, idx: number) => {
        const template = ruleBased[idx] || ruleBased[0];
        if (!template) return null;

        return {
          template,
          reasoning: String(rec.reasoning || ''),
          customization: String(
            rec.customization || rec.description || template.description
          ),
        };
      })
      .filter(Boolean) as Array<{
      template: ProjectTemplate;
      reasoning: string;
      customization: string;
    }>;
  } catch {
    return [];
  }
}

/**
 * 项目进度跟踪
 */
export interface ProjectProgress {
  templateId: string;
  userId: string;
  status: 'planning' | 'in_progress' | 'completed' | 'abandoned';
  startedAt: string;
  milestones: Array<{
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
    completedAt?: string;
  }>;
  deliverables: Array<{
    type: 'github_repo' | 'article' | 'mvp' | 'research' | 'community';
    url?: string;
    title: string;
    description: string;
  }>;
  completedAt?: string;
  resumeDescription?: string;
}

/**
 * 项目完成后生成简历描述
 */
export function generateResumeDescriptionFromProgress(
  progress: ProjectProgress,
  template: ProjectTemplate
): string {
  const completedMilestones = progress.milestones.filter(
    (m) => m.status === 'completed'
  );
  const deliverablesWithUrl = progress.deliverables.filter((d) => d.url);

  let description = template.resumeDescription;

  // 注入真实数据
  if (deliverablesWithUrl.length > 0) {
    description += '\n• 实际产出：';
    deliverablesWithUrl.forEach((d) => {
      description += `\n  - ${d.title}（${d.url}）`;
    });
  }

  description += `\n• 完成度：${completedMilestones.length}/${progress.milestones.length} 里程碑`;

  return description;
}
