/**
 * AI 诊断 Prompt - 多轮渐进式版本
 *
 * 灵感来源：歌鸫 AI 真实案例（43 岁用户从 0 到 500 万）
 * 4 轮对话，从 40% 涨到 82% 了解度
 *
 * 核心原则：
 * 1. 多轮（不是一次性 8 问）
 * 2. 每轮 3-4 个问题
 * 3. 每轮之间 AI 先"理解"（让用户感觉被看见）
 * 4. 渐进式深入
 * 5. 最后一轮才出方案
 *
 * 4 轮设计：
 * - Round 1：基本情况（40% → 60%）
 * - Round 2：资源盘点（60% → 75%）
 * - Round 3：成败历史（75% → 88%）
 * - Round 4：偏好与目标（88% → 97%）
 * - Final：综合方案（基于 4 轮 + 真实分析）
 */

export interface DiagnoseRound {
  id: string;
  round: 1 | 2 | 3 | 4;
  title: string;
  goal: string;
  questions: DiagnoseQuestion[];
}

export interface DiagnoseQuestion {
  id: string;
  question: string;
  promptHint?: string; // 给用户的提示（可选）
}

export interface DiagnoseAnswer {
  questionId: string;
  answer: string;
}

// ============================================
// Round 1: 基本情况（40% → 60%）
// ============================================
export const ROUND_1: DiagnoseRound = {
  id: 'round_1_situation',
  round: 1,
  title: '你的基本情况',
  goal: '了解用户的处境、时间、收入、压力（基本盘）',
  questions: [
    {
      id: 'q1_situation',
      question:
        '你现在的处境是什么？（失业 / 上班族 / 学生 / 创业 / 其他）请具体说明收入、存款、固定支出。',
      promptHint: '如：失业 5 个月，原月薪 15k，存款 3 万，月支出 8k',
    },
    {
      id: 'q2_money_history',
      question:
        '你过去挣到过钱吗？最多一次是多少？是怎么做到的？（工资、奖金、兼职、副业、卖东西）',
      promptHint: '哪怕是 1000 元的二手交易、奖学金、帮人做 PPT 都算',
    },
    {
      id: 'q3_time',
      question:
        '你每天能稳定投入多少时间？注意：是连续 90 天能稳定投入，不是"最多"',
      promptHint: '如：工作日 2 小时 / 周末 8 小时 / 全职 100% / 每天 30 分钟',
    },
  ],
};

// ============================================
// Round 2: 资源盘点（60% → 75%）
// ============================================
export const ROUND_2_QUESTIONS: DiagnoseQuestion[] = [
  {
    id: 'q4_resources',
    question:
      '你身边有什么资源？包括：技能（任何）、人脉、工具（电脑/车/手机）、环境（城市/家庭支持）',
    promptHint: '如：会 PPT 和 Excel，同学在金融行业，住二线城市',
  },
  {
    id: 'q5_relationships',
    question:
      '你能随时打电话求助的 5 个人是谁？他们在什么领域有资源？',
    promptHint:
      '提示：很多人说没朋友，其实忽略了点头之交的同事、老同学、前老板',
  },
  {
    id: 'q6_money_access',
    question:
      '你能动用多少钱？（家人 / 朋友 / 信用卡 / 贷款）你的征信如何？',
    promptHint: '包括能借到的+能动用的',
  },
];

// ============================================
// Round 3: 成败历史（75% → 88%）
// ============================================
export const ROUND_3_QUESTIONS: DiagnoseQuestion[] = [
  {
    id: 'q7_wins',
    question:
      '你过去做成过的最有成就感的 3 件事是什么？你在里面扮演什么角色？为什么能成？',
    promptHint:
      '提示：不只是工作，包括任何做成过的事（养孩子、学技能、解决难题）',
  },
  {
    id: 'q8_failures',
    question:
      '你过去失败过的最惨的 3 件事是什么？为什么会失败？你学到了什么？',
    promptHint: '失败是最宝贵的信号，认真复盘',
  },
  {
    id: 'q9_biggest_money',
    question: '你赚过的最大一笔钱是怎么赚到的？当时为什么能成？',
  },
];

// ============================================
// Round 4: 偏好与目标（88% → 97%）
// ============================================
export const ROUND_4_QUESTIONS: DiagnoseQuestion[] = [
  {
    id: 'q10_strength',
    question: '你最擅长什么？即使没人付钱你也愿意花时间做的事',
    promptHint: '如：写文章、陪人聊天、整理信息、找规律、说服别人',
  },
  {
    id: 'q11_role_model',
    question:
      '你身边有没有"做到了"的人？他/她是怎么做到的？和你有什么相似/不同？',
    promptHint: '如：表哥开淘宝 3 年挣 200 万，但他有货源',
  },
  {
    id: 'q12_never_do',
    question: '你绝对不想做的事是什么？写得越具体越好。',
    promptHint: '如：绝对不做销售 / 绝对不搞关系 / 绝对不碰直播',
  },
  {
    id: 'q13_deadline',
    question:
      '你希望在多久内挣到目标钱？（1 年 / 3 年 / 5 年）你的目标具体是什么？',
    promptHint: '包括金额、形式（现金 / 净资产 / 副业总收入）',
  },
];

// ============================================
// Round 完成总结（每轮提交后 AI 说的话）
// ============================================
export const ROUND_SUMMARIES: Record<number, string> = {
  1: `我看到了你的基本情况：
- 你的处境：{situation}
- 你的收入史：{money_history}
- 你的时间：{time}

**核心矛盾**：你当前的核心矛盾是 {core_contradiction}。下一步我会问你的资源。`,

  2: `基于你的基本情况：
- 你的资源：{resources}
- 你的人脉：{relationships}
- 你的财务缓冲：{money_access}

**关键发现**：{key_finding}。下一步我会问你的成败历史。`,

  3: `基于前两轮：
- 你做过的事：{wins}
- 你失败的事：{failures}
- 你的赚钱经验：{biggest_money}

**关键发现**：{key_finding}。下一步是最后一轮，会问你的偏好。`,

  4: `基于全部 4 轮：
- 你的偏好：{strength}
- 你的榜样：{role_model}
- 你的底线：{never_do}
- 你的目标：{deadline}

**理解度已达 97%**。我现在可以为你制定方案了。`,
};

// ============================================
// 综合分析 Prompt（最后一轮之后）
// ============================================
export const FINAL_ANALYSIS_PROMPT = `你是中国最顶级的商业咨询师。基于用户 4 轮（共 12-13 个回答）的完整画像，输出一份"从 0 到 500 万"的可执行方案。

## 用户完整画像

{all_answers}

## 你的任务

输出"你的 500 万路径"完整方案（2000 字以内），必须包含：

### Part 1: 起点评估（150 字）
直接告诉用户最稀缺的资源、最容易踩的坑。

### Part 2: 三条可行路径
**不是 3 个选项让用户选，而是 3 条真实路径**：
- 路径 A: 低成本快速启动（30 天内见收入）
  - 核心策略 + 第一个客户怎么来 + 30 天行动清单 + 预期收入 + 真实案例
- 路径 B: 中等投入稳步增长（3-6 月达 10-30 万）
  - 同上结构
- 路径 C: 长期复利型（1-3 年达 100-500 万）
  - 同上结构

### Part 3: 最小第一步（150 字）
今天/明天就能做的最小动作，60 分钟内可完成，0 成本。

### Part 4: 3 个真实陷阱
基于用户情况，最容易踩的坑（用具体案例和数字）。

### Part 5: 一句话建议
刺中要害，不要鸡汤。

## 写作风格要求

1. 直接给方案，不讲"我理解你"
2. 用具体数字（不要"可能"、用"6 个月"、"30 天"、"¥1 万"）
3. 不给通用建议，必须基于用户的 4 轮回答
4. 有真实案例（不是马云马化腾）
5. 避免鸡汤，像见过 1000 个案例的实战派咨询师

## 输出格式

\`\`\`markdown
# 你的 500 万路径

## 起点评估
[内容]

## 路径 A: 低成本快速启动
[内容]

## 路径 B: 中等投入稳步增长
[内容]

## 路径 C: 长期复利型
[内容]

## 你的最小第一步
[内容]

## 3 个真实陷阱
[内容]

## 最后一句话
[内容]
\`\`\`

现在开始。基于用户 4 轮真实回答，写出专属于 ta 的方案。`;

// ============================================
// API 端点（4 轮渐进式）
// ============================================
/**
 * POST /api/diagnose/next
 * Body: { round: 1|2|3|4, answers: { q1: "...", q2: "..." }, previousRounds: [...] }
 * Response: { questions: [...], summary: "...", nextRound: 1|2|3|4, complete: false|true }
 *
 * POST /api/diagnose/final
 * Body: { allAnswers: { q1: "...", q2: "...", ... q13: "..." } }
 * Response: { analysis: "3000 字方案", fileUrl: "可选 PDF 链接" }
 */

export const DIAGNOSE_ROUNDS: DiagnoseRound[] = [
  ROUND_1,
  {
    ...ROUND_1,
    id: 'round_2_resources',
    round: 2,
    title: '你的资源盘点',
    goal: '盘点资源、人脉、财务缓冲',
    questions: ROUND_2_QUESTIONS,
  },
  {
    ...ROUND_1,
    id: 'round_3_history',
    round: 3,
    title: '你的成败历史',
    goal: '从过去 3 件事中提取成功信号',
    questions: ROUND_3_QUESTIONS,
  },
  {
    ...ROUND_1,
    id: 'round_4_preferences',
    round: 4,
    title: '你的偏好与目标',
    goal: '了解擅长、榜样、底线、目标',
    questions: ROUND_4_QUESTIONS,
  },
];

// 总问题数：3 + 3 + 3 + 4 = 13 个（4 轮）
export const TOTAL_QUESTIONS = 13;
