/**
 * Claude Sonnet 4.6 Provider（高质量场景）
 *
 * 用于求职信生成、深度改写等需要顶级质量的场景。
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  AIProviderName,
  AIRequest,
  AIResponse,
  AIStreamChunk,
  IAIProvider,
  ProviderConfig,
} from './types';
import { AIProviderError } from './types';

export class ClaudeProvider implements IAIProvider {
  readonly name: AIProviderName = 'claude';
  readonly config: ProviderConfig;

  private client: Anthropic;

  constructor(config: ProviderConfig) {
    this.config = config;

    if (!config.apiKey) {
      throw new AIProviderError(
        'Anthropic API key is required',
        this.name,
        'AUTH_ERROR'
      );
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
      timeout: config.timeoutMs || 60_000,
      maxRetries: config.maxRetries || 2,
    });
  }

  async call(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: request.options?.maxTokens ?? 4096,
        temperature: request.options?.temperature ?? 0.7,
        top_p: request.options?.topP,
        stop_sequences: request.options?.stopSequences,
        system: request.systemPrompt || 'You are a helpful AI assistant.',
        messages: [
          {
            role: 'user',
            content: request.userPrompt,
          },
        ],
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      return {
        content: text,
        provider: this.name,
        model: this.config.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens:
            response.usage.input_tokens + response.usage.output_tokens,
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
      const stream = this.client.messages.stream({
        model: this.config.model,
        max_tokens: request.options?.maxTokens ?? 4096,
        temperature: request.options?.temperature ?? 0.7,
        top_p: request.options?.topP,
        stop_sequences: request.options?.stopSequences,
        system: request.systemPrompt || 'You are a helpful AI assistant.',
        messages: [
          {
            role: 'user',
            content: request.userPrompt,
          },
        ],
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const content = event.delta.text;
          fullContent += content;
          onChunk({
            content,
            done: false,
            provider: this.name,
          });
        }

        if (event.type === 'message_start') {
          inputTokens = event.message.usage.input_tokens;
        }

        if (event.type === 'message_delta') {
          outputTokens = event.usage.output_tokens;
        }
      }

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

    if (error instanceof Anthropic.APIError) {
      const status = error.status ?? 0;
      let code: AIProviderError['code'] = 'UNKNOWN';

      if (status === 401) code = 'AUTH_ERROR';
      else if (status === 429) code = 'RATE_LIMIT';
      else if (status === 408 || status === 504) code = 'TIMEOUT';
      else if (status >= 400 && status < 500) code = 'INVALID_REQUEST';
      else if (status >= 500) code = 'SERVER_ERROR';

      return new AIProviderError(
        `Claude API Error: ${error.message}`,
        this.name,
        code,
        error
      );
    }

    const errMessage =
      error instanceof Error ? error.message : String(error);
    return new AIProviderError(
      `Claude Unknown Error: ${errMessage}`,
      this.name,
      'UNKNOWN',
      error
    );
  }
}
