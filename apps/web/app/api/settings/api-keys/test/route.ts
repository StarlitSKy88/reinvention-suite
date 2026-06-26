/**
 * API Key 连接测试
 *
 * POST /api/settings/api-keys/test
 * Body: { provider: 'minimax' | 'claude' | 'deepseek' | 'custom' }
 *
 * 返回连接测试结果
 */

import { NextResponse } from 'next/server';
import { decryptSecret } from '@/lib/crypto/aes';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// 模拟数据库
const userApiKeys: Map<string, Record<string, any>> = new Map();

function getUserId(): string {
  return 'demo-user';
}

export async function POST(request: Request) {
  try {
    const { provider } = await request.json();
    const userId = getUserId();
    const config = userApiKeys.get(userId)?.[provider];

    if (!config || !config.apiKey) {
      return NextResponse.json({
        success: false,
        message: '未配置 API Key',
      });
    }

    // 解密 API Key
    const apiKey = config.apiKey.startsWith('****')
      ? config.apiKey
      : decryptSecret(config.apiKey);

    // 测试对应 Provider
    let result: { success: boolean; message: string };

    if (provider === 'claude') {
      result = await testClaude(apiKey);
    } else {
      // minimax / deepseek / custom 都用 OpenAI 协议
      result = await testOpenAI(provider, apiKey, config.baseUrl, config.model);
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `测试失败：${(error as Error).message}`,
    });
  }
}

async function testOpenAI(
  provider: string,
  apiKey: string,
  baseUrl?: string,
  model?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl || undefined,
      timeout: 10000,
    });

    const response = await client.chat.completions.create({
      model: model || 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5,
    });

    return {
      success: true,
      message: `${provider} 连接成功（${response.model || model || 'unknown'}）`,
    };
  } catch (error) {
    return {
      success: false,
      message: `${provider} 连接失败：${(error as Error).message}`,
    };
  }
}

async function testClaude(
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    const client = new Anthropic({ apiKey, timeout: 10000 });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'ping' }],
    });

    return {
      success: true,
      message: `Claude 连接成功（${response.model}）`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Claude 连接失败：${(error as Error).message}`,
    };
  }
}
