/**
 * AI Router — 智能路由
 *
 * 根据任务类型 + 用户偏好 + Provider 状态自动选择最优 Provider。
 * 包含 fallback 机制、缓存、重试。
 */

import type {
  AIProviderName,
  AIRequest,
  AIResponse,
  AIStreamChunk,
  AITaskType,
  IAIProvider,
} from './types';
import { AIProviderError } from './types';
import { MiniMaxProvider } from './minimax';
import { ClaudeProvider } from './claude';
import { DeepSeekProvider } from './deepseek';

/**
 * 路由策略：每个任务的 Provider 选择
 */
const ROUTING_STRATEGY: Record<
  AITaskType,
  {
    primary: AIProviderName;
    fallback: AIProviderName;
    highQuality?: AIProviderName;
  }
> = {
  // 简历改写：主用 MiniMax，升级 Claude
  resume_rewrite: {
    primary: 'deepseek',
    fallback: 'deepseek',
    highQuality: 'claude',
  },

  // 简历解析：主用 MiniMax
  resume_parse: { primary: 'deepseek', fallback: 'deepseek' },

  // JD 分析：主用 MiniMax
  jd_analysis: { primary: 'deepseek', fallback: 'deepseek' },

  // 差距分析：主用 MiniMax，可升级 Claude
  gap_analysis: {
    primary: 'deepseek',
    fallback: 'deepseek',
    highQuality: 'claude',
  },

  // 求职信：主用 Claude（要文采）
  cover_letter: {
    primary: 'claude',
    fallback: 'minimax',
  },

  // 年龄去敏：主用 MiniMax
  age_mask: { primary: 'deepseek', fallback: 'deepseek' },

  // 反歧视检测：主用 MiniMax
  discrim_detect: { primary: 'deepseek', fallback: 'deepseek' },

  // 项目推荐：主用 MiniMax
  project_recommend: { primary: 'deepseek', fallback: 'deepseek' },

  // 公司匹配：主用 MiniMax
  company_match: { primary: 'deepseek', fallback: 'deepseek' },

  // 大批量匹配：降本到 DeepSeek
  bulk_match: { primary: 'deepseek', fallback: 'minimax' },
};

/**
 * AI Router
 */
export class AIRouter {
  private providers: Map<AIProviderName, IAIProvider>;
  private cache: Map<string, AIResponse> = new Map();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 小时
  private readonly CACHE_MAX_SIZE = 1000;

  constructor(providers: Record<AIProviderName, IAIProvider>) {
    this.providers = new Map(
      Object.entries(providers) as [AIProviderName, IAIProvider][]
    );
  }

  /**
  /**
   * 创建默认 Router（从环境变量）
   * 注意：只在有 API key 时才创建 Provider，避免构造失败
   */
  static create(): AIRouter {
    const providers: Partial<Record<AIProviderName, IAIProvider>> = {};

    // 总是尝试创建 MiniMax（主推理）
    providers.minimax = new MiniMaxProvider({
      name: 'minimax',
      apiKey: process.env.DEEPSEEK_API_KEY || process.env.MINIMAX_API_KEY || 'placeholder',
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash' || 'MiniMax-M3',
      enabled: !!process.env.DEEPSEEK_API_KEY || process.env.MINIMAX_API_KEY,
    });

    // 只在有 API key 时才添加 Claude
    if (process.env.ANTHROPIC_API_KEY) {
      providers.claude = new ClaudeProvider({
        name: 'claude',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        enabled: true,
      });
    }

    // 只在有 API key 时才添加 DeepSeek
    if (process.env.DEEPSEEK_API_KEY) {
      providers.deepseek = new DeepSeekProvider({
        name: 'deepseek',
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: process.env.DEEPSEEK_BASE_URL,
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        enabled: true,
      });
    }

    return new AIRouter(providers as Record<AIProviderName, IAIProvider>);
  }

  /**
   * 调用 AI（自动选择 Provider + fallback）
   */
  async call(
    request: AIRequest,
    options?: { useHighQuality?: boolean; skipCache?: boolean }
  ): Promise<AIResponse> {
    // 检查缓存
    const cacheKey = this.buildCacheKey(request);
    if (!options?.skipCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    const strategy = ROUTING_STRATEGY[request.task];
    const primaryName = options?.useHighQuality
      ? strategy.highQuality || strategy.primary
      : strategy.primary;

    const errors: AIProviderError[] = [];

    // 尝试主 Provider
    try {
      const response = await this.callProvider(primaryName, request);
      this.setCache(cacheKey, response);
      return response;
    } catch (error) {
      if (error instanceof AIProviderError) {
        errors.push(error);
        // 如果是非可恢复错误，立即 fallback
        if (this.shouldFallback(error)) {
          // 尝试 fallback
          try {
            const response = await this.callProvider(strategy.fallback, request);
            this.setCache(cacheKey, response);
            return response;
          } catch (fallbackError) {
            if (fallbackError instanceof AIProviderError) {
              errors.push(fallbackError);
            }
          }
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    // 所有 Provider 都失败
    throw new AIProviderError(
      `All AI providers failed for task ${request.task}: ${errors
        .map((e) => e.message)
        .join('; ')}`,
      primaryName,
      'UNKNOWN',
      errors
    );
  }

  /**
   * 流式调用
   */
  async stream(
    request: AIRequest,
    onChunk: (chunk: AIStreamChunk) => void,
    options?: { useHighQuality?: boolean }
  ): Promise<AIResponse> {
    const strategy = ROUTING_STRATEGY[request.task];
    const primaryName = options?.useHighQuality
      ? strategy.highQuality || strategy.primary
      : strategy.primary;

    const provider = this.providers.get(primaryName);
    if (!provider) {
      throw new AIProviderError(
        `Provider ${primaryName} not configured`,
        primaryName,
        'INVALID_REQUEST'
      );
    }

    return provider.stream(request, onChunk);
  }

  /**
   * 健康检查所有 Provider
   */
  async healthCheckAll(): Promise<Record<AIProviderName, boolean>> {
    const results = await Promise.all(
      Array.from(this.providers.entries()).map(async ([name, provider]) => {
        try {
          const healthy = await provider.healthCheck();
          return [name, healthy] as const;
        } catch {
          return [name, false] as const;
        }
      })
    );

    return Object.fromEntries(results) as Record<AIProviderName, boolean>;
  }

  // ─── Private Methods ────────────────────────────────────────────────────────

  private async callProvider(
    name: AIProviderName,
    request: AIRequest
  ): Promise<AIResponse> {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new AIProviderError(
        `Provider ${name} not configured`,
        name,
        'INVALID_REQUEST'
      );
    }

    if (!provider.config.enabled) {
      throw new AIProviderError(
        `Provider ${name} is disabled (missing API key?)`,
        name,
        'AUTH_ERROR'
      );
    }

    return provider.call(request);
  }

  private shouldFallback(error: AIProviderError): boolean {
    // 这些错误应该 fallback
    return (
      error.code === 'RATE_LIMIT' ||
      error.code === 'TIMEOUT' ||
      error.code === 'SERVER_ERROR' ||
      error.code === 'UNKNOWN'
    );
  }

  private buildCacheKey(request: AIRequest): string {
    // 简单 hash：task + userPrompt + systemPrompt + temperature
    return [
      request.task,
      request.userPrompt,
      request.systemPrompt || '',
      request.options?.temperature ?? 0.7,
    ].join('|');
  }

  private getFromCache(key: string): AIResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // 检查是否过期
    const age = Date.now() - (cached.usage.totalTokens || 0);
    if (age > this.CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return { ...cached, cached: true };
  }

  private setCache(key: string, response: AIResponse): void {
    // LRU 简单实现：超过 max size 时清空
    if (this.cache.size >= this.CACHE_MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, response);
  }
}

// 单例导出
let _router: AIRouter | null = null;

export function getAIRouter(): AIRouter {
  if (!_router) {
    _router = AIRouter.create();
  }
  return _router;
}
