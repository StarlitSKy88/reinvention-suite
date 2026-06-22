/**
 * API Key 管理 API
 *
 * GET /api/settings/api-keys - 获取当前用户的所有 Provider 配置
 * POST /api/settings/api-keys - 保存/更新某个 Provider 的配置
 * DELETE /api/settings/api-keys?provider=xxx - 删除某个 Provider 的配置
 *
 * API Key 使用 AES-256-GCM 加密存储
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { encryptSecret, decryptSecret, mask } from '@/lib/crypto/aes';

const ProviderConfigSchema = z.object({
  provider: z.enum(['minimax', 'claude', 'deepseek', 'custom']),
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
  highQualityOnly: z.boolean().optional(),
});

// 模拟数据库（实际应使用 PostgreSQL）
const userApiKeys: Map<string, Record<string, any>> = new Map();

function getUserId(request: Request): string {
  // TODO: 从 JWT 中获取真实 userId
  return 'demo-user';
}

export async function GET(request: Request) {
  const userId = getUserId(request);
  const userKeys = userApiKeys.get(userId) || {};

  // 返回时脱敏
  const masked: Record<string, any> = {};
  for (const [provider, config] of Object.entries(userKeys)) {
    masked[provider] = {
      ...config,
      apiKey: config.apiKey ? mask(config.apiKey) : '',
      hasKey: !!config.apiKey,
    };
  }

  return NextResponse.json({
    success: true,
    data: masked,
  });
}

export async function POST(request: Request) {
  try {
    const userId = getUserId(request);
    const body = await request.json();
    const config = ProviderConfigSchema.parse(body);

    // 加密 API Key
    let encryptedKey = config.apiKey;
    if (config.apiKey && !config.apiKey.startsWith('****')) {
      encryptedKey = encryptSecret(config.apiKey);
    }

    // 保存
    const userKeys = userApiKeys.get(userId) || {};
    userKeys[config.provider] = {
      ...config,
      apiKey: encryptedKey,
      updatedAt: new Date().toISOString(),
    };
    userApiKeys.set(userId, userKeys);

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        apiKey: config.apiKey ? mask(config.apiKey) : '',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid configuration' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const userId = getUserId(request);
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');

  if (!provider) {
    return NextResponse.json(
      { success: false, error: 'Provider required' },
      { status: 400 }
    );
  }

  const userKeys = userApiKeys.get(userId) || {};
  delete userKeys[provider];
  userApiKeys.set(userId, userKeys);

  return NextResponse.json({ success: true });
}
