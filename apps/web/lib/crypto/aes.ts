/**
 * AES-256-GCM 加密
 *
 * 用于加密敏感字段（API Key、用户隐私数据等）
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // GCM 推荐 12 bytes
const AUTH_TAG_LENGTH = 16;
const SALT = 'reinvention-salt-v1';

let _key: Buffer | null = null;

/**
 * 获取加密密钥（从环境变量派生）
 */
function getKey(): Buffer {
  if (_key) return _key;

  const password = process.env.ENCRYPTION_KEY || 'dev-encryption-key-change-in-production';
  _key = scryptSync(password, SALT, KEY_LENGTH);
  return _key;
}

/**
 * 加密（返回 base64 字符串）
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // 格式：iv(12) + authTag(16) + ciphertext
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

/**
 * 解密
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const buffer = Buffer.from(ciphertext, 'base64');

  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8');
}

/**
 * 加密敏感字段（如 API Key）
 * 用于存入数据库
 */
export function encryptSecret(secret: string): string {
  return encrypt(secret);
}

/**
 * 解密敏感字段
 */
export function decryptSecret(encrypted: string): string {
  return decrypt(encrypted);
}

/**
 * 哈希（用于不可逆场景，如密码、token）
 */
import { createHash } from 'crypto';

export function hash(data: string, salt?: string): string {
  const h = createHash('sha256');
  h.update(data);
  if (salt) h.update(salt);
  return h.digest('hex');
}

/**
 * 掩码显示（如显示手机号 138****1234）
 */
export function mask(value: string, visibleStart = 3, visibleEnd = 4): string {
  if (value.length <= visibleStart + visibleEnd) return '*'.repeat(value.length);
  return (
    value.slice(0, visibleStart) +
    '*'.repeat(value.length - visibleStart - visibleEnd) +
    value.slice(-visibleEnd)
  );
}
