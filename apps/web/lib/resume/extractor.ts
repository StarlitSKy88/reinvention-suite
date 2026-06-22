/**
 * 简历结构化提取器
 *
 * 使用 LLM 从简历纯文本提取结构化信息：
 * - 基础信息（姓名、联系方式、工作年限）
 * - 工作经历
 * - 教育经历
 * - 技能
 * - 项目经验
 *
 * 输入：脱敏后的纯文本简历
 * 输出：结构化 JSON
 */

import { getAIRouter } from '@/lib/ai';
import { PROMPT_REGISTRY } from '@reinvention/prompts/v1';
import type { ResumeStructured } from '@reinvention/types';

export interface ExtractionContext {
  /** 期望的目标岗位（可选，用于上下文）*/
  targetJob?: string;
  /** 期望的行业（可选）*/
  targetIndustry?: string;
}

export interface ExtractionResult {
  /** 结构化数据 */
  data: ResumeStructured;
  /** LLM 原始输出（用于调试）*/
  rawOutput: string;
  /** 使用的 Provider */
  provider: string;
  /** 耗时（毫秒）*/
  durationMs: number;
}

const RESUME_EXTRACTION_SYSTEM_PROMPT = `你是一位专业的简历解析助手，专注于从 35+ 求职者简历中提取结构化信息。

## 你的任务

从用户提供的【简历纯文本】中提取以下结构化信息，并严格按 JSON Schema 输出。

## 提取原则

1. **宁缺毋滥**：没有的信息不要编造，留空数组或 null
2. **保留原意**：描述保持原文风格，不要美化
3. **数字精确**：业绩数字要精确到原文
4. **时间规范**：duration 用 "YYYY.MM - YYYY.MM" 格式
5. **适合 35+ 用户**：完整保留资深经历，不要因为年龄删减

## 输出 JSON Schema

\`\`\`json
{
  "name": "脱敏后的姓名（已经是 * 形式）",
  "contact": {
    "email": "脱敏后的邮箱",
    "phone": "脱敏后的电话",
    "location": "工作地点（城市级）"
  },
  "summary": "1-3 句话总结候选人的核心定位",
  "experiences": [
    {
      "company": "公司名",
      "title": "职位",
      "duration": "YYYY.MM - YYYY.MM",
      "description": "1-2 句话工作描述",
      "achievements": ["具体成就 1", "具体成就 2"]
    }
  ],
  "education": [
    {
      "school": "学校名",
      "degree": "学位（如：本科/硕士/MBA）",
      "major": "专业",
      "duration": "YYYY.MM - YYYY.MM"
    }
  ],
  "skills": ["技能 1", "技能 2"],
  "projects": [
    {
      "name": "项目名",
      "description": "项目简介",
      "technologies": ["技术栈"],
      "role": "担任角色",
      "duration": "YYYY.MM - YYYY.MM"
    }
  ],
  "metadata": {
    "totalYearsOfExperience": 总工作年限数字,
    "industries": ["所在行业"],
    "seniorityLevel": "entry|mid|senior|manager|director|vp|executive"
  }
}
\`\`\`

## 注意事项

- 简历原文已脱敏，姓名/电话/邮箱是 **** 形式，**不要尝试还原**
- 经历顺序按时间倒序（最近的在最前）
- 中文简历优先返回中文字段
- 如果某字段无法识别，输出空数组或 null，不要瞎猜`;

/**
 * 提取简历结构化信息
 */
export async function extractResumeStructured(
  redactedText: string,
  userId: string,
  context: ExtractionContext = {}
): Promise<ExtractionResult> {
  const startTime = Date.now();
  const router = getAIRouter();

  // 构建 prompt
  const userPrompt = `请从以下简历中提取结构化信息：

${context.targetJob ? `【目标岗位】${context.targetJob}\n` : ''}${context.targetIndustry ? `【目标行业】${context.targetIndustry}\n` : ''}
【简历原文（已脱敏）】

${redactedText}

请输出严格的 JSON。`;

  const response = await router.call({
    task: 'resume_parse',
    systemPrompt: RESUME_EXTRACTION_SYSTEM_PROMPT,
    userPrompt,
    options: {
      temperature: 0.1, // 低温度保证稳定输出
      maxTokens: 4000,
    },
  });

  // 解析 JSON 响应
  let parsedData: Partial<ResumeStructured>;
  try {
    parsedData = parseJsonFromResponse(response.content);
  } catch (error) {
    throw new ExtractionError(
      `LLM 输出无法解析为 JSON: ${(error as Error).message}`,
      response.content
    );
  }

  // 构造完整结构化数据
  const data: ResumeStructured = {
    userId,
    name: parsedData.name || '未知',
    contact: {
      email: parsedData.contact?.email || '',
      phone: parsedData.contact?.phone || '',
      location: parsedData.contact?.location || '',
    },
    experiences: parsedData.experiences || [],
    education: parsedData.education || [],
    skills: parsedData.skills || [],
    projects: parsedData.projects || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  return {
    data,
    rawOutput: response.content,
    provider: response.provider,
    durationMs: Date.now() - startTime,
  };
}

/**
 * 从 LLM 响应中提取 JSON
 * 处理各种 JSON 格式：纯 JSON、Markdown 代码块、混入文字
 */
function parseJsonFromResponse(content: string): any {
  // 尝试 1：直接解析
  try {
    return JSON.parse(content);
  } catch {
    // 继续尝试
  }

  // 尝试 2：提取 ```json ... ``` 代码块
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch {
      // 继续尝试
    }
  }

  // 尝试 3：提取第一个 {...} JSON 对象
  const jsonMatch = content.match(/\{[\s\S]+\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // 继续尝试
    }
  }

  // 尝试 4：宽松匹配（可能跨多行）
  const looseMatch = content.match(/\{[\s\S]*?\}/);
  if (looseMatch) {
    try {
      return JSON.parse(looseMatch[0]);
    } catch (error) {
      throw new Error(
        `无法解析 JSON。原始内容片段: ${content.slice(0, 200)}...`
      );
    }
  }

  throw new Error('响应中未找到 JSON');
}

/**
 * 提取错误
 */
export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly rawOutput: string
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}

// 导出 Prompt（便于测试和复用）
export { RESUME_EXTRACTION_SYSTEM_PROMPT };
