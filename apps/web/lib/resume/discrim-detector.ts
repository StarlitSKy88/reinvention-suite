/**
 * 反歧视触发器检测器
 *
 * 检测简历中可能无意识触发 HR 偏见的表述。
 * 即使 HR 自己也没有意识到，这些表述也会影响招聘决策。
 */

import { getAIRouter } from '@/lib/ai';
import { PROMPT_REGISTRY } from '@reinvention/prompts/v1';

// ─── 类型定义 ────────────────────────────────────────────────────────────────

export type BiasType =
  | 'SALARY_CONCERN' // 薪酬暗示过强
  | 'MANAGEMENT_BURDEN' // 资历暗示管理难度
  | 'AGE_SIGNAL' // 年龄信号（与年龄去敏重叠）
  | 'GENDER_SIGNAL' // 性别信号
  | 'FAMILY_STATUS' // 婚育状态
  | 'LOCATION_BIAS' // 地域偏好
  | 'STABILITY_DOUBT' // 稳定性疑虑
  | 'OVERQUALIFIED'; // 资历过高

export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DiscrimDetection {
  original: string;
  biasType: BiasType;
  riskLevel: RiskLevel;
  hrPsychology: string; // HR 看到这个时的潜台词
  suggestion: string;
  rewritten: string;
}

export interface DiscrimDetectResult {
  detections: DiscrimDetection[];
  overallRiskScore: number; // 0-100
  recommendations: string[];
  durationMs: number;
}

// ─── 规则引擎 ────────────────────────────────────────────────────────────────

interface BiasPattern {
  pattern: RegExp;
  biasType: BiasType;
  riskLevel: RiskLevel;
  psychology: string;
  defaultSuggestion: string;
}

const BIAS_PATTERNS: BiasPattern[] = [
  // 薪酬暗示
  {
    pattern: /管理\s*\d+\s*[万千百]\s*[元圆美]?/g,
    biasType: 'SALARY_CONCERN',
    riskLevel: 'HIGH',
    psychology: '"管理过千万预算，可能薪酬期望很高"',
    defaultSuggestion: '改为"负责 X 业务线的资源协调"',
  },
  {
    pattern: /\d+\s*[万千百]\s*(预算|营收|流水)/g,
    biasType: 'SALARY_CONCERN',
    riskLevel: 'MEDIUM',
    psychology: '"数字越大，HR 越担心薪酬期望"',
    defaultSuggestion: '保留数字但强调"成本控制"或"ROI 提升"',
  },

  // 管理负担
  {
    pattern: /带\s*\d{3,}\s*人\s*(团队|小组|部门)/g,
    biasType: 'MANAGEMENT_BURDEN',
    riskLevel: 'HIGH',
    psychology: '"带过 100+ 人，担心管不动小团队或不愿做 IC"',
    defaultSuggestion: '改为"管理 30 人团队（含 5 名经理）"或强调"扁平化管理"',
  },
  {
    pattern: /管理\s*\d{2,}\s*人/g,
    biasType: 'MANAGEMENT_BURDEN',
    riskLevel: 'MEDIUM',
    psychology: '"团队规模较大，可能期望高管职位"',
    defaultSuggestion: '保留但强调"高效"和"赋能"',
  },
  {
    pattern: /向\s*(VP|CTO|CEO|总裁)\s*汇报/g,
    biasType: 'MANAGEMENT_BURDEN',
    riskLevel: 'LOW',
    psychology: '"汇报层级高，可能期待高级职位"',
    defaultSuggestion: '保留，这是实力证明',
  },

  // 婚育/性别
  {
    pattern: /(已婚|未婚|已婚已育|已婚未育|单身|离异)/g,
    biasType: 'FAMILY_STATUS',
    riskLevel: 'HIGH',
    psychology: '"婚育状态是 HR 决策的隐性因素"',
    defaultSuggestion: '**完全删除**，不要在简历中提及任何婚育状态',
  },
  {
    pattern: /男\s*士|女\s*士/g,
    biasType: 'GENDER_SIGNAL',
    riskLevel: 'MEDIUM',
    psychology: '"可能产生性别偏见"',
    defaultSuggestion: '删除性别标识（简历本身不需要）',
  },

  // 稳定性
  {
    pattern: /\d{4}\s*年\s*至今.*\d{4}\s*年/g,
    biasType: 'STABILITY_DOUBT',
    riskLevel: 'LOW',
    psychology: '"长期任职是好信号，但如果只写一家公司，HR 会担心适应能力"',
    defaultSuggestion: '在 Summary 中强调"持续学习"和"适应新环境"',
  },
];

function ruleBasedDiscrimScan(text: string): DiscrimDetection[] {
  const detections: DiscrimDetection[] = [];

  for (const pattern of BIAS_PATTERNS) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      detections.push({
        original: match[0],
        biasType: pattern.biasType,
        riskLevel: pattern.riskLevel,
        hrPsychology: pattern.psychology,
        suggestion: pattern.defaultSuggestion,
        rewritten: generateQuickDiscrimRewrite(match[0], pattern.biasType),
      });
    }
  }

  return detections;
}

function generateQuickDiscrimRewrite(
  text: string,
  biasType: BiasType
): string {
  switch (biasType) {
    case 'FAMILY_STATUS':
      return ''; // 完全删除
    case 'GENDER_SIGNAL':
      return '';
    case 'SALARY_CONCERN':
      return text.replace(/管理\s*\d+\s*[万千百]\s*[元圆美]?/g, '负责相关业务线资源');
    case 'MANAGEMENT_BURDEN':
      return text.replace(/带\s*(\d{3,})\s*人/g, '管理扁平化团队');
    default:
      return text;
  }
}

// ─── LLM 深度检测 ──────────────────────────────────────────────────────────

async function llmDeepDiscrimScan(text: string): Promise<DiscrimDetection[]> {
  const router = getAIRouter();

  const response = await router.call({
    task: 'discrim_detect',
    systemPrompt: PROMPT_REGISTRY.v1.DISCRIM_DETECT,
    userPrompt: `请分析以下简历中的歧视触发风险：

${text}

请输出严格的 JSON 格式。`,
    options: {
      temperature: 0.2,
      maxTokens: 3000,
    },
  });

  return parseDiscrimResponse(response.content);
}

function parseDiscrimResponse(content: string): DiscrimDetection[] {
  const jsonMatch = content.match(/\{[\s\S]+\}/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return (parsed.detections || []).map((d: any) => ({
      original: String(d.original || ''),
      biasType: (d.biasType || 'OVERQUALIFIED') as BiasType,
      riskLevel: (d.riskLevel || 'LOW') as RiskLevel,
      hrPsychology: String(d.hrPsychology || ''),
      suggestion: String(d.suggestion || ''),
      rewritten: String(d.rewritten || d.original || ''),
    }));
  } catch {
    return [];
  }
}

// ─── 主函数 ────────────────────────────────────────────────────────────────

export async function detectDiscrimRisk(
  resumeText: string,
  options?: { useLLM?: boolean }
): Promise<DiscrimDetectResult> {
  const startTime = Date.now();

  // Step 1: 规则引擎
  const ruleDetections = ruleBasedDiscrimScan(resumeText);

  // Step 2: LLM 深度检测
  let llmDetections: DiscrimDetection[] = [];
  if (options?.useLLM !== false) {
    try {
      llmDetections = await llmDeepDiscrimScan(resumeText);
    } catch {
      // 忽略 LLM 错误
    }
  }

  // Step 3: 合并去重
  const merged = mergeDiscrimDetections(ruleDetections, llmDetections);

  // Step 4: 计算风险评分
  const overallRiskScore = calculateDiscrimRisk(merged);

  // Step 5: 建议
  const recommendations = generateDiscrimRecommendations(merged);

  return {
    detections: merged,
    overallRiskScore,
    recommendations,
    durationMs: Date.now() - startTime,
  };
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

function mergeDiscrimDetections(
  rule: DiscrimDetection[],
  llm: DiscrimDetection[]
): DiscrimDetection[] {
  const merged = [...rule];
  const originals = new Set(rule.map((d) => d.original));

  for (const d of llm) {
    if (!originals.has(d.original)) {
      merged.push(d);
    }
  }

  return merged;
}

function calculateDiscrimRisk(detections: DiscrimDetection[]): number {
  const weights = { HIGH: 30, MEDIUM: 15, LOW: 5 };
  const total = detections.reduce((sum, d) => sum + weights[d.riskLevel], 0);
  return Math.min(100, total);
}

function generateDiscrimRecommendations(
  detections: DiscrimDetection[]
): string[] {
  const recs: string[] = [];
  const types = new Set(detections.map((d) => d.biasType));

  if (types.has('FAMILY_STATUS')) {
    recs.push('⚠️ 立即删除所有婚育状态信息，这是隐性歧视的最大触发器');
  }
  if (types.has('GENDER_SIGNAL')) {
    recs.push('删除性别标识，简历本身不需要');
  }
  if (types.has('SALARY_CONCERN')) {
    recs.push('避免直接提及"管理 X 万预算"，改为"负责 X 业务线"');
  }
  if (types.has('MANAGEMENT_BURDEN')) {
    recs.push('超大团队规模可强调"扁平化管理"和"赋能"');
  }
  if (types.has('OVERQUALIFIED')) {
    recs.push('如果目标岗位比您的资历低，Summary 中要表达"为什么想要这个岗位"');
  }

  recs.push('通读简历，假设自己是 HR，看哪些表述可能让您犹豫');
  recs.push('请 2-3 位不同年龄段的朋友帮看简历，收集反馈');

  return recs;
}
