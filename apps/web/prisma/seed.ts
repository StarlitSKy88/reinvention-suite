/**
 * Prisma 种子数据 — 从 mock 迁移到 DB
 *
 * 运行：pnpm prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始 seed...');

  // 1. 标杆案例
  console.log('  📊 写入 GovSuccessCase...');
  await prisma.govSuccessCase.createMany({
    data: [
      {
        ageRange: '40-45',
        industry: '互联网',
        unemploymentMonths: 8,
        targetJob: 'AI 产品经理',
        originalSalary: 50,
        newSalary: 95,
        storyNarrative:
          '张女士，42 岁，原某互联网大厂运营经理。被裁后 8 个月找不到合适工作，通过"再出发"完成：1）简历年龄去敏；2）启动"AI 产品经理"转型项目（开源 + 写作）；3）匹配到 12 家 AI 公司，3 个月内拿到 2 个 offer。最终选择某 AI 创业公司，年薪从 50w 涨到 95w。',
        permissionGranted: true,
        isPublic: true,
        regionCode: 'beijing',
        govProgramId: 'demo-program',
      },
      {
        ageRange: '45-50',
        industry: '制造业',
        unemploymentMonths: 14,
        targetJob: '解决方案专家',
        originalSalary: 35,
        newSalary: 65,
        storyNarrative:
          '王先生，48 岁，原制造业 IT 负责人。被裁 14 个月，通过"再出发"完成：1）简历反歧视改写；2）匹配长三角制造业解决方案岗位；3）入职某德国制造业中国区，年薪从 35w 涨到 65w。',
        permissionGranted: true,
        isPublic: true,
        regionCode: 'shanghai',
        govProgramId: 'demo-program',
      },
      {
        ageRange: '35-40',
        industry: '金融',
        unemploymentMonths: 5,
        targetJob: '风控产品经理',
        originalSalary: 60,
        newSalary: 88,
        storyNarrative:
          '李女士，38 岁，原银行风控产品经理。5 个月找到某互联网金融公司，年薪从 60w 涨到 88w。',
        permissionGranted: true,
        isPublic: true,
        regionCode: 'shenzhen',
        govProgramId: 'demo-program',
      },
    ],
    skipDuplicates: true,
  });

  // 2. 政府机会（mock 数据）
  console.log('  🎯 写入 GovOpportunity...');
  await prisma.govOpportunity.createMany({
    data: [
      {
        source: 'CCGP',
        sourceUrl: 'http://www.ccgp.gov.cn/cggg/dfgg/example1',
        title: 'XX 区再就业服务平台建设项目',
        buyer: 'XX 区人力资源和社会保障局',
        location: '北京',
        budget: '¥150 万',
        description: '建设面向 35+ 失业群体的再就业服务平台，包含简历优化、岗位匹配、项目孵化等功能',
        publishDate: new Date('2026-06-15'),
        keywordScore: 95,
        budgetScore: 80,
        freshnessScore: 100,
        regionScore: 100,
        buyerTypeScore: 100,
        competitionScore: 90,
        totalScore: 92,
        recommendation: 'high',
        status: 'NEW',
      },
      {
        source: 'HRSS_BULLETIN',
        sourceUrl: 'https://rsj.shanghai.gov.cn/example2',
        title: '上海市稳就业服务采购公告',
        buyer: '上海市就业促进中心',
        location: '上海',
        budget: '¥300 万',
        description: '为上海市 35+ 失业人员提供再就业服务，预计覆盖 5 万人',
        publishDate: new Date('2026-06-10'),
        keywordScore: 90,
        budgetScore: 100,
        freshnessScore: 80,
        regionScore: 100,
        buyerTypeScore: 100,
        competitionScore: 85,
        totalScore: 89,
        recommendation: 'high',
        status: 'NEW',
      },
      {
        source: 'CCGP',
        sourceUrl: 'http://www.ccgp.gov.cn/cggg/dfgg/example3',
        title: '深圳南山区 AI 求职服务试点',
        buyer: '深圳南山区人力资源局',
        location: '深圳',
        budget: '¥80 万',
        description: 'AI 求职服务试点项目，面向科技行业求职者',
        publishDate: new Date('2026-05-28'),
        keywordScore: 75,
        budgetScore: 60,
        freshnessScore: 60,
        regionScore: 90,
        buyerTypeScore: 95,
        competitionScore: 70,
        totalScore: 72,
        recommendation: 'medium',
        status: 'NEW',
      },
    ],
    skipDuplicates: true,
  });

  // 3. 创建 demo 用户
  console.log('  👤 创建 demo 用户...');
  await prisma.user.upsert({
    where: { email: 'demo@reinvention.local' },
    update: {},
    create: {
      email: 'demo@reinvention.local',
      role: 'USER',
      regionCode: 'beijing',
    },
  });

  console.log('✅ Seed 完成！');
}

main()
  .catch((e) => {
    console.error('❌ Seed 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
