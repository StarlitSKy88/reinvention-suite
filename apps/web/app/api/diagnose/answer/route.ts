/**
 * POST /api/diagnose/answer
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/diagnose/session';
import { getAIRouter } from '@/lib/ai';
import { DIAGNOSE_ROUNDS } from '@/prompts/multi-turn-diagnosis';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { sessionId, answers } = await request.json();
    if (!sessionId || !Array.isArray(answers)) {
      return NextResponse.json({ success: false, error: 'Invalid' }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    if (session.completedAt) {
      return NextResponse.json({ success: false, error: 'Completed' }, { status: 400 });
    }

    const currentRound = Number(session.currentRound);

    answers.forEach((a: { questionId: string; answer: string }) => {
      session.answers[a.questionId] = a.answer;
    });

    let summary = '';
    try {
      const router = getAIRouter();
      const userPrompt = `Round ${currentRound}:\n` +
        answers.map((a: any) => `${a.questionId}: ${a.answer}`).join('\n') +
        '\n\n请给 100 字"我看到你"总结。';
      const result = await Promise.race([
        router.call({
          task: 'gap_analysis',
          systemPrompt: '你是一位顶级商业咨询师，给出简洁有温度的总结。',
          userPrompt,
          options: { maxTokens: 300, temperature: 0.7 },
        }),
        new Promise<{ content: string }>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 8000)
        ),
      ]);
      summary = result.content;
    } catch (e) {
      summary = '我看到了你的回答。基于你提供的信息，我正在分析你的具体情况。继续回答可以更精准。';
    }

    if (currentRound >= 4) {
      let plan = '';
      try {
        const router = getAIRouter();
        const allAnswers = Object.entries(session.answers)
          .map(([k, v]) => `${k}: ${v}`).join('\n');
        const planPrompt = `用户画像：\n${allAnswers}\n\n输出"你的 500 万路径"方案（2000 字内）。`;
        const planResult = await Promise.race([
          router.call({
            task: 'gap_analysis',
            systemPrompt: '你是一位顶级商业咨询师，输出方案。',
            userPrompt: planPrompt,
            options: { maxTokens: 2000, temperature: 0.7 },
          }),
          new Promise<{ content: string }>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 8000)
          ),
        ]);
        plan = planResult.content;
      } catch (e) {
        plan = `# 你的 500 万路径\n\n## 起点评估\n基于你的回答，我们正在分析。\n\n## 路径 A\n利用现有技能，先接到付费客户。\n\n## 路径 B\n3-6 个月到 10 万。\n\n## 路径 C\n1-3 年达 100 万。\n\n## 第一步\n今天联系 5 个老同事。`;
      }
      session.completedAt = new Date().toISOString();
      session.roundsHistory.push({
        round: 4,
        questions: [],
        answers: [],
        summary: plan,
        completedAt: session.completedAt,
      });
      return NextResponse.json({ success: true, summary, complete: true, plan });
    }

    const nextRound = currentRound + 1;
    session.currentRound = nextRound as any;
    const nextConfig = DIAGNOSE_ROUNDS.find((r) => r.round === nextRound);

    return NextResponse.json({
      success: true,
      summary,
      nextRound,
      complete: false,
      questions: nextConfig?.questions || [],
    });
  } catch (error) {
    console.error('answer error:', error);
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
