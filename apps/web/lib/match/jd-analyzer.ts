/**
 * JD 关键词分析器
 *
 * 从 JD 文本中提取结构化信息：
 * - 关键词（技能、工具、经验）
 * - 必备 vs 加分项
 * - 行业、职级、薪资范围
 * - 公司画像
 */

import { getAIRouter } from '@/lib/ai';

export interface JDAnalysis {
  title: string;
  company?: string;
  location?: string;
  // 关键词（按权重排序）
  keywords: Array<{
    keyword: string;
    weight: number; // 1-10
    category: 'skill' | 'tool' | 'experience' | 'soft_skill' | 'certification';
    required: boolean;
  }>;
  // 必备要求
  requirements: string[];
  // 加分项
  niceToHave: string[];
  // 行业
  industry?: string;
  // 职级
  seniorityLevel?: 'entry' | 'mid' | 'senior' | 'manager' | 'director' | 'executive';
  // 薪资范围（如果 JD 提到）
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  // 公司画像
  companyProfile?: {
    size?: string; // startup / mid / large / faang
    culture?: string[];
    techStack?: string[];
  };
}

const JD_ANALYSIS_SYSTEM_PROMPT = `你是一位资深招聘数据分析师，专注于从 JD（Job Description）文本中提取结构化信息。

## 你的任务

从 JD 文本中提取结构化字段，用于后续的简历匹配。

## 提取原则

1. **关键词权重**：
   - "必须""要求""必备"= 9-10 分
   - "熟练""掌握"= 7-8 分
   - "了解""熟悉"= 4-5 分
   - "优先""加分""最好"= 2-3 分

2. **必需 vs 加分**：
   - "必须有 X 经验" → required: true
   - "有 X 经验优先" → required: false

3. **职级判断**：
   - entry: 0-2 年经验，应届/初级
   - mid: 2-5 年
   - senior: 5-8 年
   - manager: 8+ 年，需带团队
   - director: 15+ 年，VP 级别
   - executive: C-level

## 输出 JSON Schema

\`\`\`json
{
  "title": "岗位名",
  "company": "公司名（如果能从 JD 中识别）",
  "location": "工作地点",
  "keywords": [
    {
      "keyword": "技能/工具/经验名",
      "weight": 1-10,
      "category": "skill|tool|experience|soft_skill|certification",
      "required": true/false
    }
  ],
  "requirements": ["必备要求 1", "必备要求 2"],
  "niceToHave": ["加分项 1"],
  "industry": "行业",
  "seniorityLevel": "entry|mid|senior|manager|director|executive",
  "salaryRange": {"min": 数字, "max": 数字, "currency": "CNY"},
  "companyProfile": {
    "size": "startup|mid|large|faang",
    "culture": ["文化关键词"],
    "techStack": ["技术栈"]
  }
}
\`\`\``;

/**
 * 分析 JD
 */
export async function analyzeJD(jdText: string): Promise<JDAnalysis> {
  const router = getAIRouter();

  const response = await router.call({
    task: 'jd_analysis',
    systemPrompt: JD_ANALYSIS_SYSTEM_PROMPT,
    userPrompt: `请分析以下 JD：

${jdText}

请输出严格的 JSON 格式。`,
    options: {
      temperature: 0.1,
      maxTokens: 3000,
    },
  });

  return parseJDResponse(response.content);
}

function parseJDResponse(content: string): JDAnalysis {
  const jsonMatch = content.match(/\{[\s\S]+\}/);
  if (!jsonMatch) {
    throw new Error('JD 分析响应未找到 JSON');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: String(parsed.title || ''),
      company: parsed.company ? String(parsed.company) : undefined,
      location: parsed.location ? String(parsed.location) : undefined,
      keywords: (parsed.keywords || []).map((k: any) => ({
        keyword: String(k.keyword || ''),
        weight: Number(k.weight || 5),
        category: k.category || 'skill',
        required: Boolean(k.required),
      })),
      requirements: (parsed.requirements || []).map(String),
      niceToHave: (parsed.niceToHave || []).map(String),
      industry: parsed.industry ? String(parsed.industry) : undefined,
      seniorityLevel: parsed.seniorityLevel,
      salaryRange: parsed.salaryRange
        ? {
            min: Number(parsed.salaryRange.min || 0),
            max: Number(parsed.salaryRange.max || 0),
            currency: String(parsed.salaryRange.currency || 'CNY'),
          }
        : undefined,
      companyProfile: parsed.companyProfile,
    };
  } catch (error) {
    throw new Error(`JD JSON 解析失败: ${(error as Error).message}`);
  }
}
