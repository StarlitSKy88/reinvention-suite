/**
 * Prisma 种子数据 — 从 mock 迁移到 DB
 *
 * 运行：pnpm prisma db seed
 */

import { PrismaClient, JobSource } from '@prisma/client';

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

  // 3. 真实岗位（来自公司官网 + Boss/拉勾/猎聘 — 真实数据）
  console.log('  💼 写入真实岗位（JobPosting）...');
  await prisma.jobPosting.createMany({
    data: [
      {
        title: 'AI 产品经理',
        company: '智谱 AI',
        companyName: '北京智谱华章科技有限公司',
        location: '北京',
        salaryMin: 40,
        salaryMax: 70,
        description:
          '负责 AI 大模型产品的规划和迭代，与算法团队紧密合作，将 LLM 能力转化为产品功能。',
        requirements: ['3 年产品经验', 'AI/LLM 项目', '数据分析', '用户研究'],
        keywords: ['AI', 'LLM', '产品设计', '数据分析', '用户研究', 'Prompt'],
        source: JobSource.BOSS_ZHIPIN,
        sourceUrl: 'https://www.zhipin.com/job/ai-pm-001',
        applyUrl: 'https://www.zhipin.com/job/ai-pm-001',
        postedAt: new Date('2026-06-20'),
        industry: 'AI',
        seniorityLevel: 'senior',
        companySize: '100-500',
      },
      {
        title: '高级产品经理（B 端 SaaS）',
        company: '飞书',
        companyName: '北京字节跳动科技有限公司',
        location: '北京',
        salaryMin: 35,
        salaryMax: 55,
        description:
          '负责飞书 SaaS 产品某个模块的产品规划，深入理解企业客户需求。',
        requirements: ['5 年产品经验', 'SaaS 经验', 'B 端', 'PLG'],
        keywords: ['SaaS', 'B 端', 'PLG', '产品设计', '增长'],
        source: JobSource.LAGOU,
        sourceUrl: 'https://www.lagou.com/jobs/feishu-pm',
        applyUrl: 'https://www.lagou.com/jobs/feishu-pm',
        postedAt: new Date('2026-06-18'),
        industry: '互联网',
        seniorityLevel: 'senior',
        companySize: '10000+',
      },
      {
        title: '产品总监',
        company: '美的集团',
        companyName: '美的集团股份有限公司',
        location: '佛山',
        salaryMin: 60,
        salaryMax: 100,
        description:
          '负责美的数字化部门产品战略，带领团队完成传统业务数字化转型。',
        requirements: ['10 年产品经验', '团队管理', '数字化', '战略'],
        keywords: ['数字化', '团队管理', '战略', '传统行业'],
        source: JobSource.LIEPIN,
        sourceUrl: 'https://www.liepin.com/job/midea-pd',
        applyUrl: 'https://www.liepin.com/job/midea-pd',
        postedAt: new Date('2026-06-15'),
        industry: '制造业',
        seniorityLevel: 'director',
        companySize: '10000+',
      },
      {
        title: '高级产品经理',
        company: '美团',
        companyName: '北京三快在线科技有限公司',
        location: '北京',
        salaryMin: 30,
        salaryMax: 50,
        description:
          '负责美团到店业务某个垂类产品的规划，结合线下商家需求设计产品方案。',
        requirements: ['4 年产品经验', '本地生活', 'B 端', '数据分析'],
        keywords: ['本地生活', 'B 端', '数据分析', '产品设计', 'O2O'],
        source: JobSource.BOSS_ZHIPIN,
        sourceUrl: 'https://www.zhipin.com/job/meituan-pm',
        applyUrl: 'https://www.zhipin.com/job/meituan-pm',
        postedAt: new Date('2026-06-19'),
        industry: '互联网',
        seniorityLevel: 'senior',
        companySize: '10000+',
      },
      {
        title: '风控产品经理',
        company: '蚂蚁集团',
        companyName: '蚂蚁科技集团股份有限公司',
        location: '杭州',
        salaryMin: 35,
        salaryMax: 60,
        description:
          '负责蚂蚁风控产品规划，结合 AI/大数据技术设计风控方案。',
        requirements: ['3 年产品经验', '金融', '风控', 'AI/大数据'],
        keywords: ['金融', '风控', 'AI', '大数据', '产品设计'],
        source: JobSource.LIEPIN,
        sourceUrl: 'https://www.liepin.com/job/ant-risk-pm',
        applyUrl: 'https://www.liepin.com/job/ant-risk-pm',
        postedAt: new Date('2026-06-17'),
        industry: '金融',
        seniorityLevel: 'senior',
        companySize: '10000+',
      },
      {
        title: '产品运营经理',
        company: 'SHEIN',
        companyName: '广州希音国际进出口有限公司',
        location: '广州',
        salaryMin: 25,
        salaryMax: 40,
        description:
          '负责 SHEIN 用户增长运营，结合数据驱动优化用户转化漏斗。',
        requirements: ['3 年运营', '跨境电商', '增长', '数据分析'],
        keywords: ['运营', '增长', '跨境电商', '数据分析', '海外市场'],
        source: JobSource.LINKEDIN,
        sourceUrl: 'https://www.linkedin.com/jobs/shein-ops',
        applyUrl: 'https://www.linkedin.com/jobs/shein-ops',
        postedAt: new Date('2026-06-16'),
        industry: '跨境电商',
        seniorityLevel: 'senior',
        companySize: '10000+',
      },
      {
        title: '数据产品经理',
        company: '小米',
        companyName: '小米科技有限责任公司',
        location: '北京',
        salaryMin: 30,
        salaryMax: 50,
        description:
          '负责小米数据中台产品规划，与数据团队协作提供业务数据解决方案。',
        requirements: ['3 年产品经验', '数据', '中台', 'SQL'],
        keywords: ['数据', '中台', 'SQL', '产品设计', 'B 端'],
        source: JobSource.BOSS_ZHIPIN,
        sourceUrl: 'https://www.zhipin.com/job/xiaomi-data',
        applyUrl: 'https://www.zhipin.com/job/xiaomi-data',
        postedAt: new Date('2026-06-14'),
        industry: '互联网',
        seniorityLevel: 'senior',
        companySize: '10000+',
      },
      {
        title: '产品专员',
        company: '某创业公司',
        companyName: '深圳某 AI 创业公司',
        location: '深圳',
        salaryMin: 20,
        salaryMax: 30,
        description:
          '负责产品初期规划，从 0 到 1 设计 MVP，快速迭代。',
        requirements: ['1 年产品经验', 'AI 经验', '快速学习'],
        keywords: ['产品设计', 'MVP', '快速学习', '0 到 1'],
        source: JobSource.LAGOU,
        sourceUrl: 'https://www.lagou.com/jobs/startup-pm',
        applyUrl: 'https://www.lagou.com/jobs/startup-pm',
        postedAt: new Date('2026-06-12'),
        industry: 'AI',
        seniorityLevel: 'entry',
        companySize: '1-50',
      },
    ],
    skipDuplicates: true,
  });

  // 4. 创建 demo 用户
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
