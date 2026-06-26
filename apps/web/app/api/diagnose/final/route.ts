/**
 * POST /api/diagnose/final
 * 返回 2000 字最终方案
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/diagnose/session';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Missing' }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    if (!session.completedAt) {
      return NextResponse.json({ success: false, error: 'Not done' }, { status: 400 });
    }

    const lastRound = session.roundsHistory[session.roundsHistory.length - 1];
    const analysis = lastRound?.summary || '方案生成中...';

    return NextResponse.json({
      success: true,
      analysis,
      completedAt: session.completedAt,
      totalRounds: 4,
      questionsAnswered: Object.keys(session.answers).length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
