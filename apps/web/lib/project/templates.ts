/**
 * 项目孵化器 - 真实可执行的项目模板库
 *
 * 核心设计原则：
 * 1. 100% 真实可执行（不是 AI 编造）
 * 2. 每个项目 4-12 周可完成
 * 3. 可面试演示（有真实数据/产出）
 * 4. 针对 35+ 群体的能力补全需求
 *
 * 10 大项目类型：
 * 1. 开源贡献
 * 2. 技术写作
 * 3. 产品 MVP
 * 4. 数据实验
 * 5. 个人 IP
 * 6. 行业研究
 * 7. 社群运营
 * 8. 课程制作
 * 9. 工具开发
 * 10. 咨询服务
 */

import type { ProjectTemplate } from '@reinvention/types';

// ─── 10 大项目模板 ──────────────────────────────────────────────────────────

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  // ─── 1. 开源贡献类 ────────────────────────────────────────────────────────
  {
    id: 'oss-001',
    type: 'open_source',
    name: '从 0 到 100 stars：发布你的第一个开源项目',
    description:
      '基于 Next.js + Claude API 创建一个对 35+ 求职者有用的工具（如简历分析、年龄去敏），发布到 GitHub 并运营到 100+ stars',
    applicableGoals: ['技术深度', '产品思维', '影响力', '持续学习'],
    durationWeeks: 6,
    difficulty: 'intermediate',
    techStack: ['Next.js', 'TypeScript', 'Claude API', 'Tailwind CSS', 'Vercel'],
    steps: [
      {
        order: 1,
        title: '选定痛点 + MVP 范围',
        description:
          '选定一个真实痛点（如"35+ 简历分析"），用 1 周时间做出 MVP',
        estimatedHours: 12,
        resources: [
          {
            type: 'article',
            title: '如何选择第一个开源项目',
            url: 'https://github.com/readme/guides/building-credit',
          },
          {
            type: 'tool',
            title: 'create-next-app',
            url: 'https://nextjs.org/docs',
          },
        ],
      },
      {
        order: 2,
        title: '编写 README 和 Demo',
        description:
          '写一个清晰的 README（功能、截图、Quick Start），录制 2 分钟 Demo 视频',
        estimatedHours: 8,
        resources: [
          {
            type: 'template',
            title: 'README 模板',
            url: 'https://github.com/jehna/readme-best-practices',
          },
        ],
      },
      {
        order: 3,
        title: '发布到 Product Hunt / V2EX / Hacker News',
        description:
          '在 Product Hunt 发布，争取 Top 5 of the Day',
        estimatedHours: 6,
        resources: [
          {
            type: 'article',
            title: 'Product Hunt 发布完整指南',
            url: 'https://www.producthunt.com/',
          },
        ],
      },
      {
        order: 4,
        title: '运营到 100+ stars',
        description:
          '通过技术博客、Twitter/X、HN Reply 持续运营 4-8 周',
        estimatedHours: 20,
        resources: [],
      },
    ],
    successCriteria: [
      'GitHub 项目 stars >= 100',
      '有 3+ 个有效 issue 或 PR',
      'README 有 Demo GIF/视频',
    ],
    resumeDescription:
      '主导并开源 "AI 简历年龄去敏工具"（github.com/xxx/resume-age-mask）\n' +
      '• 6 周内从 0 到 1 完成 Next.js + Claude API 集成\n' +
      '• 上线 3 个月获得 200+ GitHub stars，被 5 个技术媒体报道\n' +
      '• 真实数据：800+ 用户使用，处理 5000+ 简历\n' +
      '• 体现能力：全栈产品能力、增长运营、用户体验',
  },

  // ─── 2. 技术写作类 ────────────────────────────────────────────────────────
  {
    id: 'writing-001',
    type: 'technical_writing',
    name: '12 周成为行业 KOL：发布 12 篇深度文章',
    description:
      '在知乎/公众号/掘金等平台，每 2 周发布 1 篇深度行业文章，半年成为某垂直领域 KOL',
    applicableGoals: ['行业洞察', '结构化思考', '影响力', '个人品牌'],
    durationWeeks: 12,
    difficulty: 'beginner',
    techStack: ['Markdown', '知乎', '公众号', 'Notion'],
    steps: [
      {
        order: 1,
        title: '选定垂直领域（如"AI 产品经理"）',
        description:
          '选定你有积累的细分领域，未来 12 周只写这个领域',
        estimatedHours: 4,
        resources: [
          {
            type: 'article',
            title: '如何成为垂直 KOL',
            url: 'https://www.zhihu.com/',
          },
        ],
      },
      {
        order: 2,
        title: '建立选题库（30 个候选）',
        description: '用 Notion 建一个选题表，记录灵感',
        estimatedHours: 4,
        resources: [],
      },
      {
        order: 3,
        title: '每 2 周发布 1 篇深度文章',
        description: '每篇 3000-5000 字，包含个人经验和数据',
        estimatedHours: 16, // 每篇 4 小时
        resources: [],
      },
      {
        order: 4,
        title: '跨平台分发 + 数据复盘',
        description: '知乎/掘金/公众号同步发布，分析阅读数据',
        estimatedHours: 4,
        resources: [],
      },
    ],
    successCriteria: [
      '发布 6+ 篇深度文章',
      '总阅读量 10000+',
      '获得 500+ 关注者',
    ],
    resumeDescription:
      '• 在知乎/公众号发布 12 篇 "AI 产品经理" 系列深度文章\n' +
      '• 总阅读量 50,000+，获得 2000+ 关注者\n' +
      '• 2 篇文章被《人人都是产品经理》转载\n' +
      '• 体现能力：行业洞察、结构化思考、持续输出',
  },

  // ─── 3. 产品 MVP 类 ────────────────────────────────────────────────────────
  {
    id: 'mvp-001',
    type: 'product_mvp',
    name: '4 周做出可运营的 ToC 小产品',
    description:
      '做出一个解决真实痛点的 ToC 小产品（如简历评分、面试模拟），并运营 3 个月积累真实数据',
    applicableGoals: ['全栈产品能力', '真实数据', '商业化思维', '用户运营'],
    durationWeeks: 4,
    difficulty: 'advanced',
    techStack: ['Next.js', 'Supabase', 'Stripe', 'Vercel'],
    steps: [
      {
        order: 1,
        title: 'Week 1：MVP 开发',
        description: '用 Supabase + Next.js 做出核心功能',
        estimatedHours: 40,
        resources: [
          {
            type: 'tool',
            title: 'Supabase',
            url: 'https://supabase.com/',
          },
        ],
      },
      {
        order: 2,
        title: 'Week 2：上线 + 找种子用户',
        description: '部署到 Vercel，在相关社群发布获取前 100 用户',
        estimatedHours: 20,
        resources: [],
      },
      {
        order: 3,
        title: 'Week 3-4：迭代 + 数据驱动',
        description: '基于用户反馈迭代，跟踪核心指标',
        estimatedHours: 20,
        resources: [],
      },
    ],
    successCriteria: [
      '产品上线运行',
      '获得 100+ 真实用户',
      '有真实使用数据可展示',
    ],
    resumeDescription:
      '• 从 0 到 1 设计并开发 ToC 产品 "AI 面试模拟器"\n' +
      '• 4 周内完成 MVP 上线，3 个月获得 2000+ 注册用户\n' +
      '• 真实数据：DAU 150，留存率 35%，付费转化率 8%\n' +
      '• 体现能力：全栈产品能力、用户运营、商业化',
  },

  // ─── 4. 数据实验类 ────────────────────────────────────────────────────────
  {
    id: 'data-001',
    type: 'data_experiment',
    name: '公开数据集分析报告',
    description:
      '选择一个公开数据集（如 Kaggle、统计局），做 4 周深度分析，产出可写进简历的报告',
    applicableGoals: ['数据驱动', '分析能力', '行业洞察'],
    durationWeeks: 4,
    difficulty: 'intermediate',
    techStack: ['Python', 'Pandas', 'Jupyter', 'Plotly'],
    steps: [
      {
        order: 1,
        title: 'Week 1：选定数据集 + 清洗',
        description:
          '选择一个与目标行业相关的数据集（如就业数据、薪资数据）',
        estimatedHours: 12,
        resources: [
          {
            type: 'tool',
            title: 'Kaggle Datasets',
            url: 'https://www.kaggle.com/datasets',
          },
        ],
      },
      {
        order: 2,
        title: 'Week 2：探索性分析',
        description: '用 Pandas 做 EDA，挖掘有趣的洞见',
        estimatedHours: 20,
        resources: [],
      },
      {
        order: 3,
        title: 'Week 3：可视化 + 报告撰写',
        description: '产出可视化报告（Notion 或 PDF）',
        estimatedHours: 16,
        resources: [],
      },
      {
        order: 4,
        title: 'Week 4：发布 + 社群分享',
        description: '在知乎/公众号/掘金发布',
        estimatedHours: 8,
        resources: [],
      },
    ],
    successCriteria: [
      '完整的数据分析报告（10+ 页）',
      '包含 5+ 个原创洞见',
      '发布后获得 1000+ 阅读',
    ],
    resumeDescription:
      '• 独立完成 "2025 中国互联网行业薪资分析报告"\n' +
      '• 基于 10 万条公开数据，发现 3 个反直觉的薪资规律\n' +
      '• 报告发布于知乎，获得 5000+ 阅读，被多家媒体引用\n' +
      '• 体现能力：数据分析、行业洞察、独立研究',
  },

  // ─── 5. 个人 IP 类 ────────────────────────────────────────────────────────
  {
    id: 'branding-001',
    type: 'personal_branding',
    name: 'LinkedIn / 脉脉 100 天个人 IP 计划',
    description:
      '在 LinkedIn 或脉脉持续输出 100 天，建立个人 IP，吸引猎头和机会',
    applicableGoals: ['个人品牌', '行业影响力', '机会获取'],
    durationWeeks: 14,
    difficulty: 'beginner',
    techStack: ['LinkedIn', '脉脉', '即刻'],
    steps: [
      {
        order: 1,
        title: 'Week 1-2：定位 + 资料完善',
        description: '完善 LinkedIn/脉脉个人资料，头像、Title、About',
        estimatedHours: 4,
        resources: [],
      },
      {
        order: 2,
        title: 'Week 3-14：每天 1 条内容（100 天）',
        description: '每天发布 1 条短内容（300 字 + 1 图）',
        estimatedHours: 30, // 平均每天 15 分钟
        resources: [],
      },
      {
        order: 3,
        title: '关键节点：长文 + 直播',
        description: '每 2 周 1 篇长文，每月 1 次直播',
        estimatedHours: 16,
        resources: [],
      },
    ],
    successCriteria: [
      '连续输出 100 天',
      'LinkedIn 500+ 连接',
      '脉脉 1000+ 关注',
    ],
    resumeDescription:
      '• 100 天连续输出 LinkedIn/脉脉，建立 "AI 产品经理" 个人 IP\n' +
      '• 累计 500+ LinkedIn 连接，1000+ 脉脉关注\n' +
      '• 吸引 5+ 猎头主动联系，3+ 行业活动邀请分享\n' +
      '• 体现能力：自我营销、内容输出、行业影响力',
  },

  // ─── 6. 行业研究类 ────────────────────────────────────────────────────────
  {
    id: 'research-001',
    type: 'industry_research',
    name: 'AI 产品经理行业研究报告',
    description:
      '做一份完整的 AI 产品经理行业研究报告（招聘需求、技能要求、薪资分布），发布到行业',
    applicableGoals: ['行业洞察', '研究能力', '权威性'],
    durationWeeks: 8,
    difficulty: 'intermediate',
    techStack: ['Notion', 'Google Sheets', '数据可视化'],
    steps: [
      {
        order: 1,
        title: 'Week 1-2：收集 100 份 JD',
        description: '从招聘网站爬取 100 份 AI 产品经理 JD',
        estimatedHours: 16,
        resources: [],
      },
      {
        order: 2,
        title: 'Week 3-4：访谈 10 位在职 AI PM',
        description: '通过社群联系 10 位 AI PM，做深度访谈',
        estimatedHours: 20,
        resources: [],
      },
      {
        order: 3,
        title: 'Week 5-6：数据分析 + 撰写',
        description: '用数据可视化工具产出报告',
        estimatedHours: 30,
        resources: [],
      },
      {
        order: 4,
        title: 'Week 7-8：发布 + 推广',
        description: '发布到知乎/公众号/PMCAFF 等',
        estimatedHours: 8,
        resources: [],
      },
    ],
    successCriteria: [
      '完整的研究报告（30+ 页）',
      '包含 100 份 JD 数据 + 10 个访谈',
      '发布后 5000+ 阅读',
    ],
    resumeDescription:
      '• 独立完成 "2025 AI 产品经理行业研究报告"\n' +
      '• 基于 100 份招聘 JD 和 10 位资深 PM 访谈\n' +
      '• 报告在 PMCAFF 发布，被 50+ 媒体转载\n' +
      '• 体现能力：行业研究、深度访谈、数据分析',
  },

  // ─── 7. 社群运营类 ────────────────────────────────────────────────────────
  {
    id: 'community-001',
    type: 'community_building',
    name: '运营一个垂直社群（500 人）',
    description:
      '创建一个垂直领域的社群（微信群/Discord），6 个月内达到 500 人，建立影响力',
    applicableGoals: ['社群运营', '行业影响力', '连接资源'],
    durationWeeks: 24,
    difficulty: 'intermediate',
    techStack: ['微信群', 'Discord', '知识星球'],
    steps: [
      {
        order: 1,
        title: 'Week 1-2：创建 + 邀请 30 位种子用户',
        description: '从个人朋友圈邀请第一批高质量成员',
        estimatedHours: 8,
        resources: [],
      },
      {
        order: 2,
        title: 'Week 3-8：日常运营（每周话题 + 嘉宾分享）',
        description: '每周 1 个话题讨论，每月 1 次嘉宾分享',
        estimatedHours: 30,
        resources: [],
      },
      {
        order: 3,
        title: 'Week 9-24：规模化（突破 500 人）',
        description: '通过裂变、内容运营达到 500 人',
        estimatedHours: 30,
        resources: [],
      },
    ],
    successCriteria: [
      '社群 500+ 活跃成员',
      '每月活跃度 30%+',
      '成员质量高（含目标岗位从业者）',
    ],
    resumeDescription:
      '• 创建并运营 "AI 转型者联盟" 微信社群（500+ 人）\n' +
      '• 每月组织 1 次嘉宾分享，4 次话题讨论\n' +
      '• 社群成员 30% 为目标岗位从业者，建立 100+ 行业连接\n' +
      '• 体现能力：社群运营、连接能力、影响力',
  },

  // ─── 8. 课程制作类 ────────────────────────────────────────────────────────
  {
    id: 'course-001',
    type: 'course_creation',
    name: '录制一门在线课程（10 节课）',
    description:
      '录制一门垂直领域的在线课程（10 节课），发布到 B站/慕课网/知识星球',
    applicableGoals: ['教学能力', '系统化思考', '被动收入'],
    durationWeeks: 12,
    difficulty: 'advanced',
    techStack: ['OBS Studio', '剪映', 'B站/慕课网'],
    steps: [
      {
        order: 1,
        title: 'Week 1-2：课程大纲',
        description: '设计 10 节课的大纲，每节 15-30 分钟',
        estimatedHours: 16,
        resources: [],
      },
      {
        order: 2,
        title: 'Week 3-10：录制 + 剪辑',
        description: '每节 1 周，含录制和剪辑',
        estimatedHours: 80,
        resources: [],
      },
      {
        order: 3,
        title: 'Week 11-12：发布 + 推广',
        description: '发布到 B站/慕课网，做冷启动',
        estimatedHours: 8,
        resources: [],
      },
    ],
    successCriteria: [
      '完成 10 节课',
      '总时长 5+ 小时',
      '发布平台观看量 1000+',
    ],
    resumeDescription:
      '• 独立录制 "AI 产品经理入门" 在线课程（10 节 / 5 小时）\n' +
      '• 发布于 B站，累计观看 5000+，最高单集 1.2 万播放\n' +
      '• 体现能力：系统化思考、教学能力、内容制作',
  },

  // ─── 9. 工具开发类 ────────────────────────────────────────────────────────
  {
    id: 'tool-001',
    type: 'tool_development',
    name: '开发一个 Chrome 扩展 / 小工具',
    description:
      '开发一个解决实际问题的 Chrome 扩展或 CLI 工具，发布到 Chrome Web Store / npm',
    applicableGoals: ['技术深度', '产品思维', '影响力'],
    durationWeeks: 3,
    difficulty: 'beginner',
    techStack: ['JavaScript', 'Plasmo / WXT', 'Chrome Extension API'],
    steps: [
      {
        order: 1,
        title: 'Week 1：开发 MVP',
        description: '选定痛点，用 Plasmo/WXT 开发 MVP',
        estimatedHours: 20,
        resources: [
          {
            type: 'tool',
            title: 'Plasmo',
            url: 'https://www.plasmo.com/',
          },
        ],
      },
      {
        order: 2,
        title: 'Week 2：UI + 用户测试',
        description: '优化 UI，邀请 10 位用户测试',
        estimatedHours: 12,
        resources: [],
      },
      {
        order: 3,
        title: 'Week 3：发布到 Chrome Web Store',
        description: '提交审核并发布',
        estimatedHours: 4,
        resources: [],
      },
    ],
    successCriteria: [
      'Chrome Web Store 上线',
      '安装量 100+',
      '评分 4.0+',
    ],
    resumeDescription:
      '• 开发 Chrome 扩展 "LinkedIn 简历一键优化"（用户 500+）\n' +
      '• Chrome Web Store 评分 4.5，安装量 800+\n' +
      '• 体现能力：前端开发、产品设计、用户增长',
  },

  // ─── 10. 咨询服务类 ────────────────────────────────────────────────────────
  {
    id: 'consulting-001',
    type: 'consulting',
    name: '副业咨询：服务 10 位转型客户',
    description:
      '基于你的行业经验，提供 1v1 职业转型咨询服务，半年内服务 10+ 客户',
    applicableGoals: ['行业洞察', '咨询能力', '副业收入'],
    durationWeeks: 16,
    difficulty: 'beginner',
    techStack: ['腾讯会议', 'Notion', '知识星球'],
    steps: [
      {
        order: 1,
        title: 'Week 1-4：包装 + 定价',
        description:
          '设计咨询服务（简历诊断 + 1v1 咨询 60min），定价 ¥499-999',
        estimatedHours: 12,
        resources: [],
      },
      {
        order: 2,
        title: 'Week 5-16：服务 10+ 客户',
        description: '通过社群、知乎等渠道获取客户',
        estimatedHours: 30,
        resources: [],
      },
      {
        order: 3,
        title: '案例整理 + 口碑传播',
        description: '收集客户反馈，形成案例库',
        estimatedHours: 8,
        resources: [],
      },
    ],
    successCriteria: [
      '服务 10+ 客户',
      '客户满意度 4.5+',
      '获得 5+ 客户好评',
    ],
    resumeDescription:
      '• 提供 "AI 产品经理转型咨询" 服务（半年 15+ 客户）\n' +
      '• 服务客户包括 3 家 500 强企业员工，平均满意度 4.8/5\n' +
      '• 体现能力：行业咨询、客户沟通、商业化',
  },
];

/**
 * 根据用户目标推荐项目模板
 */
export function recommendProjects(
  targetJob: string,
  currentSkills: string[],
  count: number = 3
): ProjectTemplate[] {
  // 简单推荐：基于目标岗位关键词匹配
  const targetKeywords = targetJob.toLowerCase().split(/\s+/);

  const scored = PROJECT_TEMPLATES.map((template) => {
    let score = 0;
    const templateText = `${template.name} ${template.description} ${template.applicableGoals.join(' ')}`.toLowerCase();

    for (const kw of targetKeywords) {
      if (templateText.includes(kw)) score += 2;
    }

    // 难度匹配：35+ 用户倾向 intermediate/beginner
    if (template.difficulty !== 'advanced') score += 1;

    return { template, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map((s) => s.template);
}
