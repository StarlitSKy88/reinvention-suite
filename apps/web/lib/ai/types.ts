/**
 * AI Provider 类型定义
 *
 * 所有 Provider 实现这个统一接口。
 * Provider 间可以无缝切换，由 router.ts 智能调度。
 */

/**
 * 支持的 AI Provider
 */
export type AIProviderName = 'minimax' | 'claude' | 'deepseek';

/**
 * AI 任务类型 — 用于 router 路由决策
 */
export type AITaskType =
  | 'resume_parse' // 简历结构化提取
  | 'resume_rewrite' // 简历反幻觉改写
  | 'jd_analysis' // JD 关键词分析
  | 'gap_analysis' // 差距分析
  | 'cover_letter' // 求职信生成
  | 'age_mask' // 年龄去敏
  | 'discrim_detect' // 反歧视检测
  | 'project_recommend' // 项目推荐
  | 'company_match' // 公司匹配
  | 'bulk_match'; // 大批量匹配（成本敏感）

/**
 * Provider 调用选项
 */
export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stopSequences?: string[];
  signal?: AbortSignal;
}

/**
 * AI 请求
 */
export interface AIRequest {
  task: AITaskType;
  systemPrompt?: string;
  userPrompt: string;
  options?: AIOptions;
}

/**
 * AI 响应
 */
export interface AIResponse {
  content: string;
  provider: AIProviderName;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  cached: boolean;
}

/**
 * 流式响应 chunk
 */
export interface AIStreamChunk {
  content: string;
  done: boolean;
  provider: AIProviderName;
}

/**
 * Provider 配置
 */
export interface ProviderConfig {
  name: AIProviderName;
  apiKey: string;
  baseUrl?: string;
  model: string;
  enabled: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Provider 抽象基类
 *
 * 所有 Provider 必须实现这两个方法：
 * - call(): 单次调用
 * - stream(): 流式调用（可选实现）
 */
export interface IAIProvider {
  readonly name: AIProviderName;
  readonly config: ProviderConfig;

  /**
   * 单次调用
   */
  call(request: AIRequest): Promise<AIResponse>;

  /**
   * 流式调用
   */
  stream(
    request: AIRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<AIResponse>;

  /**
   * 健康检查
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Provider 错误
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: AIProviderName,
    public readonly code: 'AUTH_ERROR' | 'RATE_LIMIT' | 'TIMEOUT' | 'INVALID_REQUEST' | 'SERVER_ERROR' | 'UNKNOWN',
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
