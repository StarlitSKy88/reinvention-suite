/**
 * POST /api/diagnose/final
 * 完成所有 4 轮 → 调用 LLM 生成 2000 字最终方案
 *
 * Body: { sessionId: string }
 * Response: { analysis: string, completedAt: string, totalRounds: number }
 */

import { NextResponse } from 'next/server';
import { generateFinalAnalysis, getSession } from '@/lib/diagnose/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    // 检查 session 是否完成
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }
    if (session.currentRound !== 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not completed',
          currentRound: session.currentRound,
        },
        { status: 400 }
      );
    }

    // 生成最终方案
    const analysis = await generateFinalAnalysis(sessionId);

    return NextResponse.json({
      success: true,
      analysis,
      completedAt: session.completedAt,
      totalRounds: 4,
      questionsAnswered: Object.keys(session.answers).length,
    });
  } catch (error) {
    console.error('Final analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate final analysis' },
      { status: 500 }
    );
  }
}
