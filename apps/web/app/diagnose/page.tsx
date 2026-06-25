/**
 * AI 诊断 - 聊天形式 UI
 *
 * 多轮对话（4 轮，每轮 3-4 个问题）
 * - 顶部：进度条（1/4, 2/4, 3/4, 4/4）
 * - 主区域：聊天消息（AI 消息 + 用户回答）
 * - 底部：输入框
 * - 完成时：显示方案
 *
 * 设计：黑底白字红字点缀 + 编辑感排版
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Question {
  id: string;
  question: string;
  promptHint?: string;
}

interface Message {
  id: string;
  role: 'ai' | 'user' | 'system';
  content: string;
  type?: 'summary' | 'plan' | 'question';
  round?: number;
}

export default function DiagnosePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [finalAnalysis, setFinalAnalysis] = useState('');

  // 启动诊断
  async function startDiagnose() {
    setLoading(true);
    try {
      const res = await fetch('/api/diagnose/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.sessionId);
        setCurrentRound(data.currentRound);
        setQuestions(data.questions);
        setMessages([
          {
            id: 'start-1',
            role: 'ai',
            type: 'question',
            round: 1,
            content: `第 1 轮（${data.totalRounds} 轮）\n\n${data.questions[0].question}`,
          },
        ]);
        setCurrentQuestionIndex(0);
      }
    } finally {
      setLoading(false);
    }
  }

  // 提交当前问题答案
  async function submitAnswer() {
    if (!currentInput.trim() || !questions[currentQuestionIndex]) return;
    const question = questions[currentQuestionIndex];
    const newAnswers = { ...answers, [question.id]: currentInput };
    setAnswers(newAnswers);

    // 添加用户消息
    setMessages((m) => [
      ...m,
      {
        id: `user-${question.id}`,
        role: 'user',
        content: currentInput,
      },
    ]);

    setCurrentInput('');

    // 如果是本轮最后一个问题，提交本轮
    if (currentQuestionIndex === questions.length - 1) {
      await submitRound(newAnswers);
    } else {
      // 显示下一个问题
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setMessages((m) => [
        ...m,
        {
          id: `q-${questions[currentQuestionIndex + 1].id}`,
          role: 'ai',
          type: 'question',
          round: currentRound,
          content: questions[currentQuestionIndex + 1].question,
        },
      ]);
    }
  }

  // 提交本轮所有答案
  async function submitRound(answersToSubmit: Record<string, string>) {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/diagnose/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answers: Object.entries(answersToSubmit).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        // 添加 AI 总结
        setMessages((m) => [
          ...m,
          {
            id: `summary-${currentRound}`,
            role: 'ai',
            type: 'summary',
            round: currentRound,
            content: data.summary,
          },
        ]);

        if (data.complete) {
          // 全部完成，生成最终方案
          await generateFinal();
        } else {
          // 进入下一轮
          setCurrentRound(data.nextRound);
          setQuestions(data.questions);
          setCurrentQuestionIndex(0);
          setAnswers({});
          setMessages((m) => [
            ...m,
            {
              id: `q-next`,
              role: 'ai',
              type: 'question',
              round: data.nextRound,
              content: `第 ${data.nextRound} 轮\n\n${data.questions[0].question}`,
            },
          ]);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  // 生成最终方案
  async function generateFinal() {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/diagnose/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        setFinalAnalysis(data.analysis);
        setComplete(true);
        setMessages((m) => [
          ...m,
          {
            id: 'plan',
            role: 'ai',
            type: 'plan',
            content: data.analysis,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-background min-h-screen">
      <section className="py-section">
        <span
          aria-hidden
          className="absolute top-12 right-8 text-[20vw] font-light text-accent/[0.06] leading-none select-none pointer-events-none"
        >
          {currentRound}
        </span>

        <div className="ma-layout">
          <div className="ma-bleed-right">
            <div className="flex flex-col gap-8 max-w-prose">
              {/* Header */}
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <Link
                  href="/"
                  className="meta-label hover:opacity-50"
                >
                  ← 返回首页
                </Link>
              </div>

              <h1 className="editorial-title text-display-sm">
                从 0 到 500 万
                <br />
                <span className="text-accent">AI 诊断</span>
              </h1>

              <p className="text-muted-foreground leading-relaxed">
                4 轮深度对话，每轮 3-4 个问题。
                AI 像顶级咨询师一样追问，最后给你一份"从 0 到 500 万"的具体路径。
              </p>

              {/* 进度条 */}
              {sessionId && (
                <div className="flex items-center gap-4 py-4">
                  {[1, 2, 3, 4].map((r) => (
                    <div
                      key={r}
                      className={`h-1 flex-1 ${
                        r < currentRound
                          ? 'bg-accent'
                          : r === currentRound
                            ? 'bg-accent/50'
                            : 'bg-border'
                      }`}
                    />
                  ))}
                  <span className="meta-label shrink-0">
                    {currentRound}/4
                  </span>
                </div>
              )}

              {/* 聊天区域 */}
              <div className="border border-border min-h-[400px] max-h-[500px] overflow-y-auto p-6 flex flex-col gap-4">
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Button
                      variant="accent"
                      onClick={startDiagnose}
                      disabled={loading}
                    >
                      {loading ? '启动中…' : '开始诊断 →'}
                    </Button>
                  </div>
                ) : (
                  messages.map((m) => (
                    <MessageBubble key={m.id} message={m} />
                  ))
                )}
                {loading && (
                  <div className="text-meta-label opacity-60">
                    AI 思考中…
                  </div>
                )}
              </div>

              {/* 输入框 */}
              {sessionId && !complete && questions[currentQuestionIndex] && (
                <div className="flex flex-col gap-3">
                  <div className="text-sm text-muted-foreground">
                    <span className="text-accent">Q:</span>{' '}
                    {questions[currentQuestionIndex].question}
                  </div>
                  {questions[currentQuestionIndex].promptHint && (
                    <div className="text-xs text-muted-foreground/60 italic">
                      💡 {questions[currentQuestionIndex].promptHint}
                    </div>
                  )}
                  <textarea
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        submitAnswer();
                      }
                    }}
                    placeholder="输入你的回答（回车提交，Shift+回车换行）"
                    className="w-full bg-transparent border border-border p-4 text-base focus:border-accent focus:outline-none resize-none"
                    rows={4}
                    disabled={loading}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground/60">
                      {currentInput.length} 字 · 第 {currentQuestionIndex + 1}/{questions.length} 问
                    </span>
                    <Button
                      variant="accent"
                      onClick={submitAnswer}
                      disabled={loading || !currentInput.trim()}
                    >
                      {currentQuestionIndex === questions.length - 1
                        ? currentRound < 4
                          ? '提交本轮 →'
                          : '生成最终方案 →'
                        : '下一题 →'}
                    </Button>
                  </div>
                </div>
              )}

              {/* 完成 CTA */}
              {complete && (
                <div className="border-t border-border pt-8 text-center">
                  <p className="meta-label mb-4">
                    诊断完成 · 4 轮 · 13 个问题
                  </p>
                  <Link href="/">
                    <Button variant="ghost">← 返回首页</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] border border-accent bg-accent/5 p-4 text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.type === 'summary') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] border-l-2 border-accent pl-4 py-2 text-sm text-muted-foreground italic">
          <div className="text-meta-label text-accent mb-2">第 {message.round} 轮总结</div>
          {message.content}
        </div>
      </div>
    );
  }

  if (message.type === 'plan') {
    return (
      <div className="border border-accent p-6 bg-accent/5">
        <div className="meta-label text-accent mb-4">
          你的 500 万路径
        </div>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
          {message.content}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] border border-border p-4 text-sm">
        {message.content}
      </div>
    </div>
  );
}
