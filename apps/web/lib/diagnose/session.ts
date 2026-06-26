/**
 * AI 诊断 Session 管理
 *
 * MVP: 内存 Map（dev only）
 * 生产：SQLite / PostgreSQL
 */

import { randomBytes } from 'crypto';
import type { DiagnoseAnswer, DiagnoseRound } from '@/prompts/multi-turn-diagnosis';
import { DIAGNOSE_ROUNDS } from '@/prompts/multi-turn-diagnosis';

export type DiagnoseRoundNum = 1 | 2 | 3 | 4;
export type SessionStatus = DiagnoseRoundNum | 'completed';

export interface DiagnoseSession {
  id: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  currentRound: SessionStatus;
  answers: Record<string, string>;
  roundsHistory: RoundHistoryItem[];
}

export interface RoundHistoryItem {
  round: DiagnoseRoundNum;
  questions: Array<{ id: string; question: string }>;
  answers: DiagnoseAnswer[];
  summary: string;
  completedAt: string;
}

// 内存 session store（MVP）
const sessions = new Map<string, DiagnoseSession>();

/**
 * 创建新 session
 */
export function createSession(userId: string = 'demo-user'): DiagnoseSession {
  const id = `diag_${Date.now()}_${randomBytes(4).toString('hex')}`;
  const session: DiagnoseSession = {
    id,
    userId,
    startedAt: new Date().toISOString(),
    currentRound: 1,
    answers: {},
    roundsHistory: [],
  };
  sessions.set(id, session);
  return session;
}

/**
 * 获取 session
 */
export function getSession(id: string): DiagnoseSession | null {
  return sessions.get(id) || null;
}

/**
 * 提交当前轮答案 → 返回 AI 总结 + 下一轮
 */
export async function submitRound(
  sessionId: string,
  answers: DiagnoseAnswer[]
): Promise<{
  summary: string;
  nextRound: DiagnoseRoundNum | null;
  complete: boolean;
  questions?: Array<{ id: string; question: string }>;
}> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');

  if (session.currentRound === 'completed') {
    throw new Error('Session already completed');
  }

  const currentRoundNum = session.currentRound as DiagnoseRoundNum;

  // 保存答案
  answers.forEach((a) => {
    session.answers[a.questionId] = a.answer;
  });

  // 获取当前轮的配置
  const currentRoundConfig = DIAGNOSE_ROUNDS.find(
    (r) => r.round === currentRoundNum
  );
  if (!currentRoundConfig) throw new Error('Round config not found');

  // 调用 LLM 生成总结
  const summary = await generateSummary(session, currentRoundConfig);

  // 记录本轮历史
  session.roundsHistory.push({
    round: currentRoundNum,
    questions: currentRoundConfig.questions.map((q) => ({
      id: q.id,
      question: q.question,
    })),
    answers,
    summary,
    completedAt: new Date().toISOString(),
  });

  // 判断下一轮
  if (currentRoundNum >= 4) {
    // 全部 4 轮完成
    session.currentRound = 'completed';
    session.completedAt = new Date().toISOString();
    return { summary, nextRound: null, complete: true };
  }

  const nextRoundNum = (currentRoundNum + 1) as DiagnoseRoundNum;
  session.currentRound = nextRoundNum;
  const nextRoundConfig = DIAGNOSE_ROUNDS.find((r) => r.round === nextRoundNum)!;

  return {
    summary,
    nextRound: nextRoundNum,
    complete: false,
    questions: nextRoundConfig.questions,
  };
}

/**
 * 生成综合方案
 */
export async function generateFinalAnalysis(
  sessionId: string
): Promise<string> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  if (session.currentRound !== 'completed')
    throw new Error('Session not completed yet');

  // 导入 LLM 抽象
  const { getAIRouter } = await import('@/lib/ai');
  const router = getAIRouter();

  // 构建 prompt
  const { FINAL_ANALYSIS_PROMPT } = await import(
    '@/prompts/multi-turn-diagnosis'
  );
  const allAnswersText = Object.entries(session.answers)
    .map(([qid, ans]) => `Q: ${qid}\nA: ${ans}\n`)
    .join('\n');

  const prompt = FINAL_ANALYSIS_PROMPT.replace(
    '{all_answers}',
    allAnswersText
  );

  // 调用 LLM
  const result = await router.call({
    task: 'gap_analysis', // 借用 task type（实际是诊断）
    systemPrompt:
      '你是一位顶级商业咨询师。基于用户的完整画像，输出"从 0 到 500 万"的可执行方案。',
    userPrompt: prompt,
    options: {
      temperature: 0.7,
      maxTokens: 4000,
    },
  });

  return result.content;
}

/**
 * 调用 LLM 生成"我看到你"总结
 */
async function generateSummary(
  session: DiagnoseSession,
  roundConfig: DiagnoseRound
): Promise<string> {
  const { getAIRouter } = await import('@/lib/ai');
  const router = getAIRouter();

  // 提取本轮答案
  const roundAnswers = roundConfig.questions.map((q) => {
    const answer = session.answers[q.id] || '（未回答）';
    return `Q: ${q.question}\nA: ${answer}\n`;
  });

  // 用 ROUND_SUMMARIES 模板
  const { ROUND_SUMMARIES } = await import(
    '@/prompts/multi-turn-diagnosis'
  );
  const template = ROUND_SUMMARIES[roundConfig.round];

  // 替换占位符（简单实现）
  const filled = template
    .replace('{situation}', session.answers['q1_situation'] || '未知')
    .replace('{money_history}', session.answers['q2_money_history'] || '未知')
    .replace('{time}', session.answers['q3_time'] || '未知')
    .replace('{resources}', session.answers['q4_resources'] || '未知')
    .replace('{relationships}', session.answers['q5_relationships'] || '未知')
    .replace('{money_access}', session.answers['q6_money_access'] || '未知')
    .replace('{wins}', session.answers['q7_wins'] || '未知')
    .replace('{failures}', session.answers['q8_failures'] || '未知')
    .replace('{biggest_money}', session.answers['q9_biggest_money'] || '未知')
    .replace('{strength}', session.answers['q10_strength'] || '未知')
    .replace('{role_model}', session.answers['q11_role_model'] || '未知')
    .replace('{never_do}', session.answers['q12_never_do'] || '未知')
    .replace('{deadline}', session.answers['q13_deadline'] || '未知');

  // AI 润色
  const result = await router.call({
    task: 'gap_analysis',
    systemPrompt:
      '你是一位亲切的咨询师。基于用户这一轮的回答，给出温暖的"我看到你"总结。直接说重点，不要鸡汤。150 字以内。',
    userPrompt: filled,
    options: {
      temperature: 0.7,
      maxTokens: 400,
    },
  });

  return result.content;
}
