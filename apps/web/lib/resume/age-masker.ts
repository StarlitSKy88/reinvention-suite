/**
 * 年龄去敏检测器
 *
 * 检测简历中可能暴露年龄的表述，并提供改写建议。
 * 重点关注 35+ 用户群体。
 */

import { getAIRouter } from '@/lib/ai';
import { PROMPT_REGISTRY } from '@reinvention/prompts/v1';

// ─── 类型定义 ────────────────────────────────────────────────────────────────

export type AgeRiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type AgeCategory =
  | 'DIRECT_AGE' // 直接年龄数字
  | 'GRADUATION_YEAR' // 毕业年份
  | 'YEARS_OF_EXPERIENCE' // 工作年限
  | 'OVER_SENIOR' // 暗示资历过深
  | 'OVER_SPECIALIZED' // 暗示经验单一
  | 'OUTDATED_SKILL'; // 暗示"过时"

export interface AgeDetection {
  original: string;
  riskLevel: AgeRiskLevel;
  category: AgeCategory;
  reasoning: string;
  suggestion: string;
  rewritten: string;
}

export interface AgeMaskResult {
  detections: AgeDetection[];
  overallAssessment: string;
  recommendations: string[];
  // 整体风险评分 0-100（越高风险越大）
  overallRiskScore: number;
  // 改写后的简历（如用户选择自动改写）
  rewrittenResume?: string;
  durationMs: number;
}

// ─── 规则引擎（快速检测）─────────────────────────────────────────────────────

interface AgePattern {
  pattern: RegExp;
  category: AgeCategory;
  riskLevel: AgeRiskLevel;
  reason: string;
  defaultSuggestion: string;
}

// 高风险：直接暴露年龄
const HIGH_RISK_PATTERNS: AgePattern[] = [
  {
    pattern: /\b(19|20)\d{2}\s*年\s*毕业\b/,
    category: 'GRADUATION_YEAR',
    riskLevel: 'HIGH',
    reason: '明确暴露毕业年份',
    defaultSuggestion: '删除或改为"早期"',
  },
  {
    pattern: /\b\d{2,3}\s*岁\b/,
    category: 'DIRECT_AGE',
    riskLevel: 'HIGH',
    reason: '明确暴露年龄',
    defaultSuggestion: '删除',
  },
  {
    pattern: /\b\d{2}\s*年\s*(工作经验|经验|工龄)/,
    category: 'YEARS_OF_EXPERIENCE',
    riskLevel: 'HIGH',
    reason: '工作年限过长（≥20 年）会被 ATS 标记',
    defaultSuggestion: '改为"跨 N 个技术周期"或"资深"',
  },
];

// 中风险：暗示资历
const MEDIUM_RISK_PATTERNS: AgePattern[] = [
  {
    pattern: /资深\s*\S+/g,
    category: 'OVER_SENIOR',
    riskLevel: 'MEDIUM',
    reason: '"资深"过度使用暗示资历过深',
    defaultSuggestion: '替换为"主导"或"核心"',
  },
  {
    pattern: /老兵/g,
    category: 'OVER_SENIOR',
    riskLevel: 'MEDIUM',
    reason: '"老兵"暗示年龄',
    defaultSuggestion: '替换为"持续贡献者"',
  },
  {
    pattern: /\d{2,3}\s*人\s*(团队|小组)/g,
    category: 'OVER_SENIOR',
    riskLevel: 'MEDIUM',
    reason: '大团队管理经验暗示成本高',
    defaultSuggestion: '改为"跨职能协作"或保留但强调"高效"',
  },
];

// 低风险：技术栈过时
const OUTDATED_TECH_PATTERNS: AgePattern[] = [
  {
    pattern: /\b(Visual Basic|VB6|VB\.NET|jQuery Mobile|Flash|ActionScript|Silverlight|Struts 1|EJB 2)\b/gi,
    category: 'OUTDATED_SKILL',
    riskLevel: 'LOW',
    reason: '过时技术栈暗示经验过时',
    defaultSuggestion: '如确实用过，移到"历史项目"而非"核心技能"',
  },
];

/**
 * 规则引擎快速扫描
 */
function ruleBasedScan(text: string): AgeDetection[] {
  const detections: AgeDetection[] = [];

  for (const patternGroup of [
    HIGH_RISK_PATTERNS,
    MEDIUM_RISK_PATTERNS,
    OUTDATED_TECH_PATTERNS,
  ]) {
    for (const pattern of patternGroup) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        detections.push({
          original: match[0],
          riskLevel: pattern.riskLevel,
          category: pattern.category,
          reasoning: pattern.reason,
          suggestion: pattern.defaultSuggestion,
          rewritten: generateQuickRewrite(match[0], pattern.category),
        });
      }
    }
  }

  return detections;
}

/**
 * 快速重写（不调用 LLM）
 */
function generateQuickRewrite(text: string, category: AgeCategory): string {
  switch (category) {
    case 'GRADUATION_YEAR':
      return text.replace(/\b(19|20)\d{2}\s*年\s*毕业\b/, '早期毕业');
    case 'DIRECT_AGE':
      return text.replace(/\b\d{2,3}\s*岁\b/, '');
    case 'YEARS_OF_EXPERIENCE':
      return text.replace(/\b(\d{2})\s*年\s*(工作经验|经验|工龄)/, '跨 $1 年技术演进');
    case 'OVER_SENIOR':
      return text.replace(/资深\s*(\S+)/g, '主导$1').replace(/老兵/g, '持续贡献者');
    case 'OUTDATED_SKILL':
      return `[历史项目] ${text}`;
    default:
      return text;
  }
}

// ─── LLM 深度检测（语义层）─────────────────────────────────────────────────

/**
 * LLM 深度检测
 */
async function llmDeepScan(text: string): Promise<AgeDetection[]> {
  const router = getAIRouter();

  const response = await router.call({
    task: 'age_mask',
    systemPrompt: PROMPT_REGISTRY.v1.AGE_MASK,
    userPrompt: `请分析以下简历中的年龄暴露风险：

${text}

请输出严格的 JSON 格式。`,
    options: {
      temperature: 0.2,
      maxTokens: 3000,
    },
  });

  return parseAgeMaskResponse(response.content);
}

function parseAgeMaskResponse(content: string): AgeDetection[] {
  const jsonMatch = content.match(/\{[\s\S]+\}/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const detections = parsed.detections || [];

    return detections.map((d: any) => ({
      original: String(d.original || ''),
      riskLevel: (d.riskLevel || 'LOW') as AgeRiskLevel,
      category: (d.category || 'OVER_SENIOR') as AgeCategory,
      reasoning: String(d.reasoning || ''),
      suggestion: String(d.suggestion || ''),
      rewritten: String(d.rewritten || d.original || ''),
    }));
  } catch {
    return [];
  }
}

// ─── 主函数 ────────────────────────────────────────────────────────────────

/**
 * 年龄去敏检测
 */
export async function detectAgeRisk(
  resumeText: string,
  options?: { useLLM?: boolean }
): Promise<AgeMaskResult> {
  const startTime = Date.now();

  // Step 1: 规则引擎快速扫描
  const ruleDetections = ruleBasedScan(resumeText);

  // Step 2: LLM 深度检测（可选）
  let llmDetections: AgeDetection[] = [];
  if (options?.useLLM !== false) {
    try {
      llmDetections = await llmDeepScan(resumeText);
    } catch {
      // LLM 失败不影响主流程
    }
  }

  // Step 3: 合并去重（基于 original 文本）
  const allDetections = mergeDetections(ruleDetections, llmDetections);

  // Step 4: 计算整体风险评分
  const overallRiskScore = calculateOverallRisk(allDetections);

  // Step 5: 整体评估
  const overallAssessment = generateAssessment(overallRiskScore, allDetections);

  // Step 6: 通用建议
  const recommendations = generateRecommendations(allDetections);

  return {
    detections: allDetections,
    overallAssessment,
    recommendations,
    overallRiskScore,
    durationMs: Date.now() - startTime,
  };
}

/**
 * 应用所有检测的改写建议，生成去敏后的简历
 */
export function applyAgeMask(
  resumeText: string,
  detections: AgeDetection[]
): string {
  let result = resumeText;
  // 按风险等级从高到低替换
  const sorted = [...detections].sort((a, b) => {
    const order = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    return order[b.riskLevel] - order[a.riskLevel];
  });

  for (const detection of sorted) {
    if (detection.rewritten && detection.rewritten !== detection.original) {
      result = result.replace(detection.original, detection.rewritten);
    }
  }

  return result;
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

function mergeDetections(
  rule: AgeDetection[],
  llm: AgeDetection[]
): AgeDetection[] {
  const merged = [...rule];
  const ruleOriginals = new Set(rule.map((d) => d.original));

  for (const llmDet of llm) {
    if (!ruleOriginals.has(llmDet.original)) {
      merged.push(llmDet);
    }
  }

  return merged;
}

function calculateOverallRisk(detections: AgeDetection[]): number {
  if (detections.length === 0) return 0;
  const weights = { HIGH: 30, MEDIUM: 15, LOW: 5 };
  const total = detections.reduce((sum, d) => sum + weights[d.riskLevel], 0);
  return Math.min(100, total);
}

function generateAssessment(score: number, detections: AgeDetection[]): string {
  if (score >= 60) return '高风险：简历明显暴露年龄，可能被 ATS/HR 快速筛掉';
  if (score >= 30) return '中风险：存在部分年龄暴露表述，建议优化';
  if (score > 0) return '低风险：仅有少量可疑表述';
  return '良好：简历无明显年龄暴露信号';
}

function generateRecommendations(detections: AgeDetection[]): string[] {
  const recs: string[] = [];

  const categories = new Set(detections.map((d) => d.category));

  if (categories.has('GRADUATION_YEAR')) {
    recs.push('删除所有毕业年份，或改为"早期"');
  }
  if (categories.has('DIRECT_AGE')) {
    recs.push('不要在简历中包含任何年龄数字（包括生肖、星座等）');
  }
  if (categories.has('YEARS_OF_EXPERIENCE')) {
    recs.push('超过 15 年的工作年限改为"跨 N 个技术周期"');
  }
  if (categories.has('OVER_SENIOR')) {
    recs.push('避免使用"资深""老兵"等暗示年龄的词，改为"主导""核心"');
  }
  if (categories.has('OUTDATED_SKILL')) {
    recs.push('将过时技术移到"历史项目"区域，不要放在核心技能区');
  }

  recs.push('使用近 2 年的项目作为简历亮点，体现 currency');

  return recs;
}
