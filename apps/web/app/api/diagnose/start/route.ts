/**
 * POST /api/diagnose/start
 * 启动 AI 诊断会话
 *
 * Body: { userId?: string }
 * Response: { sessionId, currentRound, questions: [{id, question}], totalRounds }
 */

import { NextResponse } from 'next/server';
import { createSession } from '@/lib/diagnose/session';
import { ROUND_1, DIAGNOSE_ROUNDS } from '@/prompts/multi-turn-diagnosis';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || 'demo-user';

    // 创建 session
    const session = createSession(userId);

    // 返回第 1 轮问题
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      currentRound: 1,
      totalRounds: 4,
      questions: ROUND_1.questions.map((q) => ({
        id: q.id,
        question: q.question,
        promptHint: q.promptHint,
      })),
      startedAt: session.startedAt,
    });
  } catch (error) {
    console.error('Start diagnosis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start diagnosis' },
      { status: 500 }
    );
  }
}
