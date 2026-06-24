/**
 * 单元测试 4: 反幻觉事实库构建
 * 测试目标: lib/ai/rewriter.ts 的 buildInitialFactBase
 */

import { describe, it, expect } from 'vitest';
import { buildInitialFactBase } from '../../lib/ai/rewriter';
import type { ResumeStructured } from '@reinvention/types';

describe('Fact Base - 反幻觉核心', () => {
  const mockResume: ResumeStructured = {
    userId: 'test-user',
    name: '张三',
    contact: { email: 'a@b.com', phone: '13800000000', location: '北京' },
    summary: '8 年 PM',
    experiences: [
      {
        company: '某公司',
        title: '高级 PM',
        duration: '2018-2024',
        description: '负责产品规划',
        achievements: ['带 10 人', 'DAU 50%'],
      },
    ],
    education: [
      {
        school: '某大学',
        degree: '本科',
        major: 'CS',
        duration: '2014-2018',
      },
    ],
    skills: ['产品设计', 'AI', '数据分析'],
    projects: [
      {
        name: 'AI 简历分析',
        description: '用 LLM 分析简历',
        technologies: ['React', 'Python'],
        role: '负责人',
      },
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    version: 1,
  };

  it('应该构建事实库（不编造）', () => {
    const factBase = buildInitialFactBase('test-user', mockResume);

    // 验证 skills 来自真实简历
    expect(factBase.skills.map((s) => s.name)).toEqual(
      expect.arrayContaining(['产品设计', 'AI', '数据分析'])
    );

    // 验证 experiences 来自真实
    expect(factBase.experiences.length).toBe(1);
    expect(factBase.experiences[0].company).toBe('某公司');
  });

  it('应该标记 userConfirmed = false（必须用户确认）', () => {
    const factBase = buildInitialFactBase('test-user', mockResume);
    expect(factBase.userConfirmed).toBe(false);
  });

  it('应该不编造项目（用空数组如果简历没有）', () => {
    const resumeNoProjects = { ...mockResume, projects: [] };
    const factBase = buildInitialFactBase('test-user', resumeNoProjects);
    expect(factBase.projects).toEqual([]);
  });

  it('应该处理空简历（边界情况）', () => {
    const emptyResume: ResumeStructured = {
      ...mockResume,
      experiences: [],
      education: [],
      skills: [],
      projects: [],
    };
    const factBase = buildInitialFactBase('test-user', emptyResume);
    expect(factBase.experiences).toEqual([]);
    expect(factBase.skills).toEqual([]);
  });

  it('应该为每个项目生成唯一 ID', () => {
    const factBase = buildInitialFactBase('test-user', mockResume);
    const ids = factBase.projects.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length); // 唯一
  });

  it('应该使用 "intermediate" 作为默认技能水平', () => {
    const factBase = buildInitialFactBase('test-user', mockResume);
    expect(factBase.skills[0].level).toBe('intermediate');
  });

  it('应该使用 "present" 作为当前工作 end 日期', () => {
    const factBase = buildInitialFactBase('test-user', mockResume);
    const lastExp = factBase.experiences[0];
    expect(['present', '']).toContain(lastExp.duration.end);
  });
});
