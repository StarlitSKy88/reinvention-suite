/**
 * JWT 鉴权
 *
 * 双 Token 机制：
 * - Access Token（短期，15 分钟）
 * - Refresh Token（长期，7 天）
 *
 * 使用 HMAC-SHA256 签名
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const ACCESS_TOKEN_TTL = 15 * 60; // 15 分钟
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 天

export interface JWTPayload {
  sub: string;          // user id
  role: string;         // 用户角色
  regionCode?: string;  // 地区
  govProgramId?: string;
  iat?: number;         // 签发时间
  exp?: number;         // 过期时间
}

/**
 * Base64URL 编码
 */
function base64UrlEncode(data: string | Buffer): string {
  const base64 = Buffer.from(data).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64URL 解码
 */
function base64UrlDecode(data: string): string {
  const padded = data + '='.repeat((4 - (data.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
}

/**
 * 生成 JWT
 */
export function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: number): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const signatureInput = `${headerB64}.${payloadB64}`;

  const signature = createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest();

  return `${signatureInput}.${base64UrlEncode(signature)}`;
}

/**
 * 验证 JWT
 */
export function verifyJWT(token: string): JWTPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;

  // 验证签名
  const expectedSignature = createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest();

  const actualSignature = Buffer.from(
    base64UrlDecode(signatureB64),
    'base64'
  );

  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    return null;
  }

  // 解析 payload
  let payload: JWTPayload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    return null;
  }

  // 检查过期
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

/**
 * 生成 Access Token
 */
export function signAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return signJWT(payload, ACCESS_TOKEN_TTL);
}

/**
 * 生成 Refresh Token
 */
export function signRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return signJWT(payload, REFRESH_TOKEN_TTL);
}

/**
 * 生成 API Key（用于服务间调用）
 */
export function generateApiKey(): { key: string; prefix: string } {
  const random = randomBytes(32).toString('hex');
  const prefix = `rin_${random.slice(0, 8)}`;
  const key = `${prefix}_${random}`;
  return { key, prefix };
}

/**
 * 验证 API Key 格式
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^rin_[a-f0-9]{8}_[a-f0-9]{64}$/.test(key);
}
