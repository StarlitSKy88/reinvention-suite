'use client';

/**
 * 简历分析报告 - 客户端组件（含反幻觉改写 UI）
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ProcessedResume {
  id: string;
  fileName: string;
  createdAt: string;
  structured: {
    name: string;
    contact: any;
    experiences: any[];
    education: any[];
    skills: string[];
    projects: any[];
  };
  ageMask: {
    detections: Array<{
      original: string;
      riskLevel: string;
      category: string;
      rewritten: string;
      reasoning: string;
    }>;
    overallRiskScore: number;
  };
  discrim: {
    detections: Array<{
      original: string;
      biasType: string;
      riskLevel: string;
      rewritten: string;
      hrPsychology: string;
    }>;
    overallRiskScore: number;
  };
  meta: {
    totalDurationMs: number;
    warnings: string[];
  };
}

interface RewriteResult {
  content: string;
  bulletSources: Array<{
    section: string;
    content: string;
    sourceFactId: string;
  }>;
  matchedKeywords: string[];
  unmatchedKeywords: string[];
  matchScore: {
    score: number;
    reasoning: string;
  } | number;
  warnings: string[];
}

export function ResumeAnalyzeClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [analysis, setAnalysis] = useState<ProcessedResume | null>(null);
  const [loading, setLoading] = useState(true);

  // 改写状态
  const [rewriteResult, setRewriteResult] = useState<RewriteResult | null>(
    null
  );
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteType, setRewriteType] = useState<
    'general' | 'age_masked' | 'discrim_safe'
  >('general');
  const [accepted, setAccepted] = useState(false);

  // 初始加载
  if (loading && !analysis) {
    if (typeof window !== 'undefined') {
      loadAnalysisData();
    }
  }

  async function loadAnalysisData() {
    try {
      const { getAnalysis } = await import('@/lib/db/analysis');
      const data = await getAnalysis(id!);
      setAnalysis(data);
    } catch (err) {
      console.error('加载分析失败', err);
    } finally {
      setLoading(false);
    }
  }

  // 触发反幻觉改写
  async function handleRewrite() {
    if (!analysis) return;
    setRewriteLoading(true);
    setRewriteResult(null);
    setAccepted(false);

    try {
      const res = await fetch('/api/resume/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          structured: analysis.structured,
          targetJob: {
            title: 'AI 产品经理',
            keywords: [
              '产品设计',
              '数据分析',
              'AI',
              '项目管理',
              '用户研究',
            ],
          },
          rewriteType,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRewriteResult(json.rewrite);
      } else {
        alert(`改写失败: ${json.message || json.error}`);
      }
    } catch (err) {
      console.error('改写失败', err);
      alert(`改写失败: ${(err as Error).message}`);
    } finally {
      setRewriteLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="ma-layout min-h-screen flex items-center justify-center">
        <div className="meta-label">加载中…</div>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="ma-layout min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <p className="meta-label">未找到简历分析</p>
          <Link href="/resume/upload">
            <Button variant="accent">上传简历</Button>
          </Link>
        </div>
      </main>
    );
  }

  const totalRiskScore =
    (analysis.ageMask.overallRiskScore + analysis.discrim.overallRiskScore) / 2;

  return (
    <main className="bg-background">
      <section className="py-section">
        <div className="ma-layout">
          <div className="ma-bleed-right">
            <div className="flex flex-col gap-12 max-w-prose">
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <Link
                  href="/resume/upload"
                  className="meta-label hover:opacity-50"
                >
                  ← 返回上传
                </Link>
              </div>

              <h1 className="editorial-title text-display-sm">
                简历<br />分析报告
              </h1>

              <div className="meta-label">
                {analysis.fileName} ·{' '}
                {new Date(analysis.createdAt).toLocaleString('zh-CN')} · 耗时{' '}
                {analysis.meta.totalDurationMs}ms
              </div>

              {/* 总风险评分 */}
              <div className="grid grid-cols-3 gap-px bg-border border border-border">
                <ScoreCard
                  label="年龄风险"
                  value={analysis.ageMask.overallRiskScore}
                />
                <ScoreCard
                  label="偏见风险"
                  value={analysis.discrim.overallRiskScore}
                />
                <ScoreCard label="综合评分" value={totalRiskScore} />
              </div>

              {/* 年龄去敏 */}
              {analysis.ageMask.detections.length > 0 && (
                <Section
                  title={`年龄暴露风险（${analysis.ageMask.detections.length}）`}
                >
                  {analysis.ageMask.detections.map((d, i) => (
                    <RiskCard
                      key={i}
                      original={d.original}
                      rewritten={d.rewritten}
                      riskLevel={d.riskLevel}
                      explanation={d.reasoning}
                    />
                  ))}
                </Section>
              )}

              {/* 反歧视 */}
              {analysis.discrim.detections.length > 0 && (
                <Section
                  title={`歧视触发风险（${analysis.discrim.detections.length}）`}
                >
                  {analysis.discrim.detections.map((d, i) => (
                    <RiskCard
                      key={i}
                      original={d.original}
                      rewritten={d.rewritten}
                      riskLevel={d.riskLevel}
                      explanation={`HR 心理：${d.hrPsychology}`}
                    />
                  ))}
                </Section>
              )}

              {/* ✨ 反幻觉改写（核心功能） */}
              <section className="border-t border-border pt-8">
                <h2 className="meta-label mb-6 text-accent">
                  ✨ 反幻觉改写
                </h2>

                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  基于你的事实库，AI 将重组表述、突出目标岗位关键词。
                  <br />
                  <span className="text-accent">反幻觉保证</span>：不会编造任何数字、项目、技能。
                  每个 bullet 都有事实来源标注。
                </p>

                {/* 改写类型选择 */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <TypeButton
                    type="general"
                    label="通用改写"
                    selected={rewriteType === 'general'}
                    onClick={() => setRewriteType('general')}
                  />
                  <TypeButton
                    type="age_masked"
                    label="年龄去敏改写"
                    selected={rewriteType === 'age_masked'}
                    onClick={() => setRewriteType('age_masked')}
                  />
                  <TypeButton
                    type="discrim_safe"
                    label="反歧视改写"
                    selected={rewriteType === 'discrim_safe'}
                    onClick={() => setRewriteType('discrim_safe')}
                  />
                </div>

                <Button
                  variant="accent"
                  onClick={handleRewrite}
                  disabled={rewriteLoading}
                >
                  {rewriteLoading
                    ? '改写中...'
                    : '一键反幻觉改写 →'}
                </Button>

                {/* 改写结果 */}
                {rewriteResult && (
                  <div className="mt-8 border-t border-border pt-6">
                    {/* 匹配分 */}
                    {rewriteResult.matchScore && (
                      <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
                        <div>
                          <div className="meta-label">匹配分</div>
                          <div
                            className={`text-3xl mt-1 ${
                              (typeof rewriteResult.matchScore === 'object'
                                ? rewriteResult.matchScore.score
                                : rewriteResult.matchScore) >= 60
                                ? 'text-accent'
                                : 'text-foreground'
                            }`}
                          >
                            {typeof rewriteResult.matchScore === 'object'
                              ? rewriteResult.matchScore.score
                              : rewriteResult.matchScore}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="meta-label mb-2">说明</div>
                          <p className="text-sm text-muted-foreground">
                            {typeof rewriteResult.matchScore === 'object'
                              ? rewriteResult.matchScore.reasoning
                              : ''}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 关键词匹配 */}
                    {rewriteResult.matchedKeywords?.length > 0 && (
                      <div className="mb-6">
                        <div className="meta-label mb-3">已匹配关键词</div>
                        <div className="flex flex-wrap gap-2">
                          {rewriteResult.matchedKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="text-xs px-2 py-1 border border-accent text-accent"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 改写后简历 */}
                    <div className="meta-label mb-3">改写后简历</div>
                    <pre className="bg-surface/30 border border-border p-6 text-sm overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                      {rewriteResult.content}
                    </pre>

                    {/* Bullet 来源标注 */}
                    {rewriteResult.bulletSources?.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-border">
                        <div className="meta-label mb-3 text-accent">
                          事实来源标注（每个 bullet 的依据）
                        </div>
                        <div className="space-y-2">
                          {rewriteResult.bulletSources.map(
                            (s, i) => (
                              <div
                                key={i}
                                className="text-xs flex gap-3 py-1.5 border-b border-border/50"
                              >
                                <span className="meta-label text-accent shrink-0">
                                  {s.sourceFactId}
                                </span>
                                <span className="text-muted-foreground">
                                  {s.section}
                                </span>
                                <span className="flex-1 truncate">
                                  "{s.content}"
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* 警告 */}
                    {rewriteResult.warnings?.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-border">
                        <div className="meta-label mb-2 text-yellow-600">
                          注意事项
                        </div>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {rewriteResult.warnings.map((w, i) => (
                            <li key={i}>⚠️ {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 采纳按钮 */}
                    {!accepted ? (
                      <div className="mt-8 flex gap-4">
                        <Button
                          variant="accent"
                          onClick={() => setAccepted(true)}
                        >
                          采纳此版本 →
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setRewriteResult(null)}
                        >
                          重新改写
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-8 p-4 border border-accent text-accent">
                        ✓ 已采纳。下一步：匹配岗位 →
                        <Link
                          href={`/match/jobs?analysisId=${id}`}
                          className="ml-4 underline"
                        >
                          跳转到匹配
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* 下一步 */}
              <div className="border-t border-border pt-8 flex flex-col gap-6">
                <h2 className="editorial-title text-2xl">下一步</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link href={`/match/jobs?analysisId=${analysis.id}`}>
                    <div className="border border-border p-6 hover:border-accent transition-colors duration-600">
                      <h3 className="editorial-title text-lg mb-2">
                        全网岗位匹配 →
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        基于你的简历，全网匹配
                      </p>
                    </div>
                  </Link>
                  <Link href={`/projects?analysisId=${analysis.id}`}>
                    <div className="border border-border p-6 hover:border-accent transition-colors duration-600">
                      <h3 className="editorial-title text-lg mb-2">
                        项目孵化 →
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        10 个真实项目模板
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  const isHigh = value >= 60;
  return (
    <div className="bg-background p-6 flex flex-col gap-3">
      <div className="meta-label">{label}</div>
      <div
        className={`text-4xl font-light ${isHigh ? 'text-accent' : 'text-foreground'}`}
      >
        {value}
        <span className="text-base text-muted-foreground">/100</span>
      </div>
      <div className="h-1 bg-border">
        <div
          className={`h-full ${isHigh ? 'bg-accent' : 'bg-foreground'}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="meta-label mb-6">{title}</h2>
      {children}
    </section>
  );
}

function RiskCard({
  original,
  rewritten,
  riskLevel,
  explanation,
}: {
  original: string;
  rewritten: string;
  riskLevel: string;
  explanation: string;
}) {
  const isHigh = riskLevel === 'HIGH';
  return (
    <div className="border border-border p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <div className="text-sm line-through opacity-60 flex-1">
          {original}
        </div>
        <span
          className={`meta-label shrink-0 ${
            isHigh ? 'text-accent' : 'text-muted-foreground'
          }`}
        >
          {riskLevel}
        </span>
      </div>
      <div className="text-sm flex-1">{rewritten}</div>
      <p className="text-xs text-muted-foreground">{explanation}</p>
    </div>
  );
}

function TypeButton({
  type,
  label,
  selected,
  onClick,
}: {
  type: 'general' | 'age_masked' | 'discrim_safe';
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm px-4 py-2 border transition-colors duration-600 ${
        selected
          ? 'border-accent text-accent'
          : 'border-border text-muted-foreground hover:border-foreground'
      }`}
    >
      {label}
    </button>
  );
}
