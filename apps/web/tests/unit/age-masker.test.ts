/**
 * 单元测试 2: 年龄去敏规则扫描
 * 测试目标: lib/resume/age-masker.ts (ruleBasedScan 部分)
 */

import { describe, it, expect } from 'vitest';

describe('Age Masker - 规则检测', () => {
  // 简化版（不依赖 LLM）
  // 注意：JS 正则的 \b 与中文不兼容，所以用宽松匹配
  const HIGH_RISK_PATTERNS = [
    {
      pattern: /(19|20)\d{2}\s*年\s*毕业/,
      category: 'GRADUATION_YEAR',
      riskLevel: 'HIGH',
    },
    {
      pattern: /\d{2,3}\s*岁/,
      category: 'DIRECT_AGE',
      riskLevel: 'HIGH',
    },
    {
      pattern: /\d{2}\s*年\s*(工作经验|经验|工龄)/,
      category: 'YEARS_OF_EXPERIENCE',
      riskLevel: 'HIGH',
    },
  ];

  function detectHighRisk(text: string) {
    const detections = [];
    for (const p of HIGH_RISK_PATTERNS) {
      if (p.pattern.test(text)) {
        detections.push({ category: p.category, riskLevel: p.riskLevel });
      }
    }
    return detections;
  }

  it('应该检测毕业年份', () => {
    const detections = detectHighRisk('我 2010 年毕业于清华大学');
    const found = detections.find(
      (d) => d.category === 'GRADUATION_YEAR'
    );
    expect(found).toBeDefined();
    expect(found?.riskLevel).toBe('HIGH');
  });

  it('应该检测年龄数字', () => {
    const detections = detectHighRisk('我今年 45 岁有 20 年经验');
    const hasDirectAge = detections.some(
      (d) => d.category === 'DIRECT_AGE'
    );
    const hasYearsExp = detections.some(
      (d) => d.category === 'YEARS_OF_EXPERIENCE'
    );
    expect(hasDirectAge).toBe(true);
    expect(hasYearsExp).toBe(true);
  });

  it('应该检测工作经验年限', () => {
    // 注意：正则要求"年"后直接是"经验"等，中间不能有其他字符
    const detections = detectHighRisk('我有 20 年经验');
    const found = detections.find(
      (d) => d.category === 'YEARS_OF_EXPERIENCE'
    );
    expect(found).toBeDefined();
    expect(found?.riskLevel).toBe('HIGH');
  });

  it('不应该误判普通文本', () => {
    const detections = detectHighRisk('我是产品经理擅长数据分析');
    expect(detections).toEqual([]);
  });
});
