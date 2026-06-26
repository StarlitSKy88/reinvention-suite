/**
 * AI Module — 统一导出
 */

export * from './types';
export * from './minimax';
export * from './claude';
export * from './deepseek';
export * from './router';

// Prompt 模板（从 @reinvention/prompts 重新导出，方便使用）
export { PROMPT_REGISTRY, type PromptKey } from '@reinvention/prompts/v1';
