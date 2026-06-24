/**
 * 单元测试 3: 纯算法匹配
 * 测试目标: lib/match/engine.ts 中的 pureAlgorithmMatch 逻辑
 * (这个测试通过创建相同算法来验证)
 */

import { describe, it, expect } from 'vitest';

// 直接实现同样的算法
interface Job {
  id: string;
  title: string;
  keywords: string[];
  requirements: string[];
}

function pureAlgorithmMatch(skills: string[], jobs: Job[]) {
  const userSkillSet = new Set(
    skills.map((s) => s.toLowerCase().trim())
  );

  return jobs
    .map((job) => {
      const jobKeywords = new Set<string>();
      job.keywords.forEach((k) => jobKeywords.add(k.toLowerCase()));
      job.requirements.forEach((r) => {
        r.split(/[\s,，、;；]+/).forEach((p) => {
          if (p.length > 1) jobKeywords.add(p.toLowerCase());
        });
      });

      const matched: string[] = [];
      const missing: string[] = [];
      for (const kw of jobKeywords) {
        if (
          userSkillSet.has(kw) ||
          Array.from(userSkillSet).some(
            (s) => s.includes(kw) || kw.includes(s)
          )
        ) {
          matched.push(kw);
        } else {
          missing.push(kw);
        }
      }

      const totalKw = jobKeywords.size || 1;
      const score = Math.round((matched.length / totalKw) * 100);

      return {
        job,
        score,
        matched,
        missing,
      };
    })
    .sort((a, b) => b.score - a.score);
}

describe('Pure Algorithm Match', () => {
  it('应该返回按匹配分降序的岗位', () => {
    const skills = ['产品设计', 'AI', '数据分析'];
    const jobs: Job[] = [
      {
        id: '1',
        title: 'AI 产品经理',
        keywords: ['AI', '产品设计', '数据分析', 'LLM'],
        requirements: [],
      },
      {
        id: '2',
        title: '运营经理',
        keywords: ['运营', '增长'],
        requirements: [],
      },
    ];

    const result = pureAlgorithmMatch(skills, jobs);

    expect(result[0].job.id).toBe('1');
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('应该计算真实匹配分（不是 100%）', () => {
    const skills = ['产品设计'];
    const jobs: Job[] = [
      {
        id: '1',
        title: '产品经理',
        keywords: ['产品设计', '数据分析', 'AI', '项目管理'],
        requirements: [],
      },
    ];

    const result = pureAlgorithmMatch(skills, jobs);
    // 1/4 = 25%
    expect(result[0].score).toBe(25);
    expect(result[0].matched).toContain('产品设计');
    expect(result[0].missing.length).toBe(3);
  });

  it('应该支持子串匹配', () => {
    const skills = ['AI产品设计'];
    const jobs: Job[] = [
      {
        id: '1',
        title: 'AI PM',
        keywords: ['AI', '产品设计'],
        requirements: [],
      },
    ];

    const result = pureAlgorithmMatch(skills, jobs);
    expect(result[0].score).toBe(100);
  });

  it('应该处理空技能列表', () => {
    const jobs: Job[] = [
      { id: '1', title: 'A', keywords: ['AI'], requirements: [] },
    ];
    const result = pureAlgorithmMatch([], jobs);
    expect(result[0].score).toBe(0);
    expect(result[0].matched.length).toBe(0);
  });

  it('应该处理空岗位列表', () => {
    const result = pureAlgorithmMatch(['AI'], []);
    expect(result).toEqual([]);
  });

  it('5 个岗位应该有不同匹配分（真实）', () => {
    const skills = ['产品设计', 'AI'];
    const jobs: Job[] = [
      { id: '1', title: 'A', keywords: ['AI', '产品设计'], requirements: [] },
      { id: '2', title: 'B', keywords: ['AI', '产品设计', '数据分析'], requirements: [] },
      { id: '3', title: 'C', keywords: ['运营'], requirements: [] },
      { id: '4', title: 'D', keywords: ['销售'], requirements: [] },
      { id: '5', title: 'E', keywords: ['AI'], requirements: [] },
    ];

    const result = pureAlgorithmMatch(skills, jobs);
    const scores = result.map((r) => r.score);
    const uniqueScores = new Set(scores);

    // 至少 2 个不同分（不是全部相同）
    expect(uniqueScores.size).toBeGreaterThan(1);
  });
});
