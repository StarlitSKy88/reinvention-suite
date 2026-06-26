/**
 * POST /api/diagnose/answer
 * 提交当前轮答案 → 返回 AI 总结 + 下一轮问题
 *
 * Body: {
 *   sessionId: string,
 *   answers: [{ questionId, answer }]
 * }
 * Response: {
 *   summary: string,           // AI 总结
 *   nextRound: 1|2|3|4|null,    // 下一轮
 *   complete: boolean,         // 是否完成
 *   questions: [{id, question}] // 下一轮问题
 * }
 */

import { NextResponse } from 'next/server';
import { submitRound, getSession } from '@/lib/diagnose/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, answers } = body;

    if (!sessionId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId or answers' },
        { status: 400 }
      );
    }

    // 检查 session
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // 提交本轮
    const result = await submitRound(sessionId, answers);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
