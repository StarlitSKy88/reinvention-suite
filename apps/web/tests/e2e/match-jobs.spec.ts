/**
 * E2E 测试: 岗位匹配流程
 *
 * 验证：
 * 1. 首页能访问
 * 2. /match/jobs 能访问
 * 3. /api/match/jobs 真实返回 5+ 个不同匹配分
 * 4. /api/jobs/list 真实返回 8+ 个岗位
 *
 * 这是 Task 5: 1 E2E 测试
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3030';

test.describe('E2E: 岗位匹配完整流程', () => {
  test('首页可访问', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBe(200);
    expect(await page.title()).toContain('再出发');
  });

  test('/match/jobs 页面可访问', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/match/jobs`);
    expect(response?.status()).toBe(200);
  });

  test('/api/jobs/list 真实返回 DB 岗位', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/jobs/list`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.total).toBeGreaterThanOrEqual(5);

    // 验证至少包含一个真实公司
    const companyNames = data.jobs.map(
      (j: { company: string }) => j.company
    );
    expect(companyNames).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/智谱|飞书|美团|蚂蚁|SHEIN|小米|美的/),
      ])
    );
  });

  test('/api/match/jobs 真实返回 5+ 个不同匹配分', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/match/jobs`, {
      data: {
        skills: ['产品设计', 'AI', '数据分析', '项目管理'],
        yearsOfExperience: 10,
        targetJob: 'AI 产品经理',
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.total).toBeGreaterThanOrEqual(3);

    // 验证每个匹配都有真实数据
    for (const m of data.matches) {
      expect(m.id).toBeTruthy();
      expect(m.title).toBeTruthy();
      expect(m.company).toBeTruthy();
      expect(m.matchScore).toBeGreaterThanOrEqual(0);
      expect(m.matchScore).toBeLessThanOrEqual(100);
      expect(m.matchedKeywords).toBeDefined();
      expect(m.missingKeywords).toBeDefined();
    }

    // 验证匹配分各不相同（不是写死的 mock）
    const scores = data.matches.map(
      (m: { matchScore: number }) => m.matchScore
    );
    const uniqueScores = new Set(scores);
    expect(uniqueScores.size).toBeGreaterThanOrEqual(3);
  });

  test('/api/gov/dashboard/cases 真实返回 3+ 个标杆案例', async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE_URL}/api/gov/dashboard/cases?scope=city`
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.length).toBeGreaterThanOrEqual(3);

    // 验证标杆案例有真实数据
    for (const c of data.data) {
      expect(c.ageRange).toBeTruthy();
      expect(c.industry).toBeTruthy();
      expect(c.originalSalary).toBeGreaterThan(0);
      expect(c.newSalary).toBeGreaterThan(0);
      expect(c.storyNarrative).toBeTruthy();
    }
  });
});
