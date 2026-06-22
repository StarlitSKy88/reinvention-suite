/**
 * DeepSeek-V3 Provider（成本兜底）
 *
 * 价格是 Claude 的 1/30，用于大批量匹配等成本敏感场景。
 * OpenAI 兼容 API。
 */

import OpenAI from 'openai';
import type {
  AIProviderName,
  AIRequest,
  AIResponse,
  AIStreamChunk,
  IAIProvider,
  ProviderConfig,
} from './types';
import { AIProviderError } from './types';

export class DeepSeekProvider implements IAIProvider {
  readonly name: AIProviderName = 'deepseek';
  readonly config: ProviderConfig;

  private client: OpenAI;

  constructor(config: ProviderConfig) {
    this.config = config;

    if (!config.apiKey) {
      throw new AIProviderError(
        'DeepSeek API key is required',
        this.name,
        'AUTH_ERROR'
      );
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || 'https://api.deepseek.com/v1',
      timeout: config.timeoutMs || 60_000,
      maxRetries: config.maxRetries || 2,
    });
  }

  async call(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const messages: OpenAI.ChatCompletionMessageParam[] = [];

      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }
      messages.push({ role: 'user', content: request.userPrompt });

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: request.options?.temperature ?? 0.7,
        max_tokens: request.options?.maxTokens ?? 4096,
        top_p: request.options?.topP,
        stop: request.options?.stopSequences,
      });

      const content = response.choices[0]?.message?.content || '';

      return {
        content,
        provider: this.name,
        model: this.config.model,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        latencyMs: Date.now() - startTime,
        cached: false,
      };
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  async stream(
    request: AIRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<AIResponse> {
    const startTime = Date.now();
    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      const messages: OpenAI.ChatCompletionMessageParam[] = [];

      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }
      messages.push({ role: 'user', content: request.userPrompt });

      const stream = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: request.options?.temperature ?? 0.7,
        max_tokens: request.options?.maxTokens ?? 4096,
        top_p: request.options?.topP,
        stop: request.options?.stopSequences,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          onChunk({
            content,
            done: false,
            provider: this.name,
          });
        }
      }

      inputTokens = Math.ceil(
        (request.systemPrompt?.length || 0) / 4 +
          (request.userPrompt.length || 0) / 4
      );
      outputTokens = Math.ceil(fullContent.length / 4);

      onChunk({
        content: '',
        done: true,
        provider: this.name,
      });

      return {
        content: fullContent,
        provider: this.name,
        model: this.config.model,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        },
        latencyMs: Date.now() - startTime,
        cached: false,
      };
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.call({
        task: 'resume_rewrite',
        userPrompt: 'ping',
        options: { maxTokens: 5, temperature: 0 },
      });
      return true;
    } catch {
      return false;
    }
  }

  private wrapError(error: unknown): AIProviderError {
    if (error instanceof AIProviderError) return error;

    if (error instanceof OpenAI.APIError) {
      const status = error.status;
      let code: AIProviderError['code'] = 'UNKNOWN';

      if (status === 401 || status === 403) code = 'AUTH_ERROR';
      else if (status === 429) code = 'RATE_LIMIT';
      else if (status === 408 || status === 504) code = 'TIMEOUT';
      else if (status >= 400 && status < 500) code = 'INVALID_REQUEST';
      else if (status >= 500) code = 'SERVER_ERROR';

      return new AIProviderError(
        `DeepSeek API Error: ${error.message}`,
        this.name,
        code,
        error
      );
    }

    const errMessage =
      error instanceof Error ? error.message : String(error);
    return new AIProviderError(
      `DeepSeek Unknown Error: ${errMessage}`,
      this.name,
      'UNKNOWN',
      error
    );
  }
}
