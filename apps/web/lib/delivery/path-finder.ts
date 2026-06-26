/**
 * 投递路径搜索
 *
 * 输入：公司名 + 岗位名
 * 输出：官网投递入口（最佳）或候选渠道清单（兜底）
 *
 * 数据源：
 * 1. Exa / Tavily（合规搜索）
 * 2. Python Scrapling 微服务（您接受反爬风险）
 */

import { getAIRouter } from '@/lib/ai';

export interface DeliveryPath {
  /** 投递方式 */
  type: 'OFFICIAL_FORM' | 'EMAIL' | 'LINKEDIN' | 'FALLBACK' | 'AGENCY';
  /** 主要 URL 或邮箱 */
  url: string;
  /** 投递说明 */
  instructions: string;
  /** 备选渠道（如果有）*/
  fallbacks?: Array<{
    type: 'LINKEDIN' | 'EMAIL' | 'WECHAT' | 'REFERRAL' | 'BOSSDIRECT';
    url: string;
    instructions: string;
  }>;
  /** 数据来源 */
  source: 'exa' | 'tavily' | 'scrapling' | 'fallback';
  /** 是否经过人工核验 */
  verified: boolean;
}

export interface DeliverySearchInput {
  companyName: string;
  jobTitle?: string;
  jobLocation?: string;
  useLLM?: boolean;
}

const DELIVERY_PATH_SYSTEM_PROMPT = `你是一位投递导航专家，帮助 35+ 求职者找到最直接的投递渠道。

## 你的任务

根据公司名 + 岗位名，输出最直接的投递方式：

### 优先级
1. **OFFICIAL_FORM**（公司官网投递表单）— 最优先，HR 必看
2. **EMAIL**（官方招聘邮箱）— 次优
3. **LINKEDIN**（LinkedIn 直 DM HR）— 35+ 群体友好
4. **AGENCY**（官方指定猎头）— 如果是高端岗位
5. **FALLBACK**（其他渠道）— 兜底

### 输出 JSON Schema

\`\`\`json
{
  "primaryPath": {
    "type": "OFFICIAL_FORM|EMAIL|LINKEDIN|AGENCY",
    "url": "URL 或邮箱",
    "instructions": "具体操作说明（如：请在官网填写以下表单）"
  },
  "fallbacks": [
    {
      "type": "LINKEDIN|EMAIL|WECHAT|REFERRAL|BOSSDIRECT",
      "url": "URL",
      "instructions": "操作说明"
    }
  ],
  "verified": false
}
\`\`\`

### 注意事项

- 如果不确定官网入口，输出 FALLBACK 类型，列出 3-5 个候选渠道
- 35+ 用户优先推荐 LinkedIn（更不容易年龄歧视）
- 远程岗位推荐 WeChat 群、内推渠道`;

export interface DeliverySearchResult {
  primary: DeliveryPath;
  searchDurationMs: number;
}

/**
 * 搜索投递路径
 */
export async function findDeliveryPath(
  input: DeliverySearchInput
): Promise<DeliverySearchResult> {
  const startTime = Date.now();

  // Step 1: 通过 Python Scrapling 微服务搜索官网入口
  let scraperResult: any = null;
  try {
    scraperResult = await callScraperService(input);
  } catch {
    // Scraper 失败不影响主流程
  }

  // Step 2: 通过 LLM 分析 + 给出投递建议
  const result = await analyzeAndRecommend(input, scraperResult);

  return {
    primary: result,
    searchDurationMs: Date.now() - startTime,
  };
}

/**
 * 调用 Python 爬虫微服务
 */
async function callScraperService(input: DeliverySearchInput): Promise<any> {
  const scraperUrl = process.env.SCRAPER_SERVICE_URL || 'http://localhost:8000';

  try {
    const response = await fetch(`${scraperUrl}/api/v1/scrape/company-careers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.SCRAPER_API_KEY || '',
      },
      body: JSON.stringify({
        company_name: input.companyName,
        job_title: input.jobTitle,
      }),
      // 30s 超时
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * LLM 分析 + 推荐投递路径
 */
async function analyzeAndRecommend(
  input: DeliverySearchInput,
  scraperResult: any
): Promise<DeliveryPath> {
  const router = getAIRouter();

  const userPrompt = `## 公司名
${input.companyName}

${
  input.jobTitle
    ? `## 岗位名
${input.jobTitle}`
    : ''
}

${
  input.jobLocation
    ? `## 工作地点
${input.jobLocation}`
    : ''
}

${
  scraperResult
    ? `## 爬虫结果
${JSON.stringify(scraperResult, null, 2)}`
    : '## 爬虫结果\n爬虫未获取到数据，请基于你的知识给出推荐。'
}

请输出严格的 JSON 格式。`;

  const response = await router.call({
    task: 'resume_rewrite', // 复用通用 LLM 调用
    systemPrompt: DELIVERY_PATH_SYSTEM_PROMPT,
    userPrompt,
    options: {
      temperature: 0.2,
      maxTokens: 2000,
    },
  });

  return parseDeliveryPathResponse(response.content);
}

function parseDeliveryPathResponse(content: string): DeliveryPath {
  const jsonMatch = content.match(/\{[\s\S]+\}/);
  if (!jsonMatch) {
    return getFallbackPath();
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const primary = parsed.primaryPath || {};

    return {
      type: primary.type || 'FALLBACK',
      url: String(primary.url || ''),
      instructions: String(primary.instructions || ''),
      fallbacks: parsed.fallbacks || [],
      source: 'exa',
      verified: false,
    };
  } catch {
    return getFallbackPath();
  }
}

/**
 * 兜底渠道清单
 */
function getFallbackPath(): DeliveryPath {
  return {
    type: 'FALLBACK',
    url: '',
    instructions: '未找到官网投递入口，建议尝试以下渠道：',
    fallbacks: [
      {
        type: 'LINKEDIN',
        url: '',
        instructions: '在 LinkedIn 搜索公司 HR 或招聘负责人，直接发送 DM',
      },
      {
        type: 'BOSSDIRECT',
        url: '',
        instructions: '在 Boss 直聘搜索公司名，查看是否有官方账号',
      },
      {
        type: 'REFERRAL',
        url: '',
        instructions: '通过行业社群、前同事寻找内推机会',
      },
      {
        type: 'WECHAT',
        url: '',
        instructions: '关注公司官方公众号，查看招聘信息',
      },
    ],
    source: 'fallback',
    verified: false,
  };
}
