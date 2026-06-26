/**
 * Resume Module - 统一导出
 */

export * from './parser';
export * from './extractor';
export * from './age-masker';
export * from './discrim-detector';

// AI Rewriter（放在 resume 模块下，因为是简历改写）
export * from '@/lib/ai/rewriter';
