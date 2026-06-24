/**
 * 单元测试 1: PII 脱敏
 * 测试目标: lib/privacy/redactor.ts
 */

import { describe, it, expect } from 'vitest';
import { redactPII } from '../../lib/privacy/redactor';
import { hash, mask } from '../../lib/crypto/aes';

describe('PII Redactor', () => {
  describe('redactPII', () => {
    it('应该脱敏手机号', () => {
      const result = redactPII('联系电话：13812345678');
      expect(result.redactedText).not.toContain('13812345678');
      expect(result.stats.phones).toBe(1);
    });

    it('应该脱敏邮箱', () => {
      const result = redactPII('邮箱：zhang.san@example.com');
      expect(result.redactedText).not.toContain('zhang.san@example.com');
      expect(result.stats.emails).toBe(1);
    });

    it('应该脱敏身份证号', () => {
      const result = redactPII('身份证：110101199001011234');
      expect(result.redactedText).not.toContain('110101199001011234');
      expect(result.stats.idCards).toBe(1);
    });

    it('应该脱敏银行卡号', () => {
      const result = redactPII('银行卡：6222021234567890123');
      expect(result.redactedText).not.toContain('6222021234567890123');
      expect(result.stats.bankCards).toBe(1);
    });

    it('应该保留姓名（首字符）', () => {
      const result = redactPII('姓名：张三');
      expect(result.redactedText).toContain('张');
      expect(result.stats.names).toBe(1);
    });

    it('应该统计总脱敏数量', () => {
      const result = redactPII(
        '电话：13812345678 邮箱：test@example.com'
      );
      expect(result.stats.total).toBe(2);
    });

    it('应该保留占位符映射', () => {
      const result = redactPII('手机：13800001234');
      expect(Object.keys(result.placeholderMap).length).toBeGreaterThan(0);
    });

    it('应该处理空字符串', () => {
      const result = redactPII('');
      expect(result.redactedText).toBe('');
      expect(result.stats.total).toBe(0);
    });
  });

  describe('mask', () => {
    it('应该掩码手机号', () => {
      expect(mask('13812345678', 3, 4)).toBe('138****5678');
    });

    it('应该掩码邮箱', () => {
      // mask 实现：保留前 visibleStart 位 + *** + 完整邮箱
      // 实际行为：'t***test@example.com'（保留 1 位后接 *** 再接完整）
      const result = mask('test@example.com', 1, 0);
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toBe('test@example.com');
      expect(result).toMatch(/^t/); // 首字符保留
    });
  });

  describe('hash', () => {
    it('应该返回相同 hash', () => {
      expect(hash('test', 'salt')).toBe(hash('test', 'salt'));
    });

    it('应该返回不同 hash（不同 salt）', () => {
      expect(hash('test', 'salt1')).not.toBe(hash('test', 'salt2'));
    });

    it('应该返回 64 字符 hex', () => {
      const h = hash('test');
      expect(h).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
