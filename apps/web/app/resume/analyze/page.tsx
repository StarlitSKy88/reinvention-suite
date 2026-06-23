/**
 * 简历分析报告页 — 黑底白字红字点缀
 *
 * 显示：
 * 1. 结构化简历预览
 * 2. 年龄去敏检测结果
 * 3. 反歧视触发器检测结果
 * 4. 改写建议
 */

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AnalysisResult {
  resume: {
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
  discrimDetect: {
    detections: Array<{
      original: string;
      biasType: string;
      riskLevel: string;
      rewritten: string;
      hrPsychology: string;
    }>;
    overallRiskScore: number;
  };
}

export default function ResumeAnalyzePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResumeAnalyzeContent />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <main className="ma-layout min-h-screen flex items-center justify-center">
      <div className="meta-label">加载中…</div>
    </main>
  );
}

function ResumeAnalyzeContent() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('id');

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysis();
  }, [resumeId]);

  async function loadAnalysis() {
    try {
      // 1. 从 IndexedDB 读取简历
      const { getDB } = await import('@/lib/db/schema');
      const db = getDB();
      const resume = await db.resumesStructured.get(Number(resumeId));

      if (!resume) {
        setLoading(false);
        return;
      }

      // 2. 年龄去敏检测
      const resumeText = JSON.stringify(resume);
      const { detectAgeRisk } = await import('@/lib/resume/age-masker');
      const ageMask = await detectAgeRisk(resumeText);

      // 3. 反歧视检测
      const { detectDiscrimRisk } = await import(
        '@/lib/resume/discrim-detector'
      );
      const discrim = await detectDiscrimRisk(resumeText);

      setAnalysis({
        resume: resume as any,
        ageMask: {
          detections: ageMask.detections,
          overallRiskScore: ageMask.overallRiskScore,
        },
        discrimDetect: {
          detections: discrim.detections,
          overallRiskScore: discrim.overallRiskScore,
        },
      });
      setLoading(false);
    } catch (err) {
      console.error('加载分析失败', err);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="ma-layout min-h-screen flex items-center justify-center">
        <div className="meta-label">分析中…</div>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="ma-layout min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <p className="meta-label">未找到简历</p>
          <Link href="/resume/upload">
            <Button variant="accent">上传简历</Button>
          </Link>
        </div>
      </main>
    );
  }

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

              <div className="flex items-center gap-12 py-6 border-y border-border">
                <div>
                  <div className="meta-label text-accent">年龄风险</div>
                  <div className="text-4xl editorial-title mt-2">
                    {analysis.ageMask.overallRiskScore}
                    <span className="text-base text-muted-foreground">/100</span>
                  </div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <div className="meta-label text-accent">偏见风险</div>
                  <div className="text-4xl editorial-title mt-2">
                    {analysis.discrimDetect.overallRiskScore}
                    <span className="text-base text-muted-foreground">/100</span>
                  </div>
                </div>
              </div>

              {/* 年龄去敏 */}
              {analysis.ageMask.detections.length > 0 && (
                <section className="border-t border-border pt-8">
                  <h2 className="meta-label mb-6">年龄暴露风险（{analysis.ageMask.detections.length}）</h2>
                  <div className="flex flex-col gap-4">
                    {analysis.ageMask.detections.map((d, i) => (
                      <div
                        key={i}
                        className="border border-border p-4 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="text-sm line-through opacity-60">
                            {d.original}
                          </div>
                          <span
                            className={`meta-label shrink-0 ${
                              d.riskLevel === 'HIGH'
                                ? 'text-accent'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {d.riskLevel}
                          </span>
                        </div>
                        <div className="text-sm">{d.rewritten}</div>
                        <p className="text-xs text-muted-foreground">
                          {d.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 反歧视触发器 */}
              {analysis.discrimDetect.detections.length > 0 && (
                <section className="border-t border-border pt-8">
                  <h2 className="meta-label mb-6">歧视触发风险（{analysis.discrimDetect.detections.length}）</h2>
                  <div className="flex flex-col gap-4">
                    {analysis.discrimDetect.detections.map((d, i) => (
                      <div
                        key={i}
                        className="border border-border p-4 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="text-sm line-through opacity-60">
                            {d.original}
                          </div>
                          <span
                            className={`meta-label shrink-0 ${
                              d.riskLevel === 'HIGH'
                                ? 'text-accent'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {d.riskLevel}
                          </span>
                        </div>
                        <div className="text-sm">{d.rewritten}</div>
                        <p className="text-xs text-muted-foreground italic">
                          HR 心理：{d.hrPsychology}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* CTA */}
              <div className="border-t border-border pt-8 flex flex-col gap-6">
                <h2 className="editorial-title text-2xl">下一步</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link href="/match/jobs">
                    <div className="border border-border p-6 hover:border-accent transition-colors duration-600">
                      <h3 className="editorial-title text-lg mb-2">岗位匹配</h3>
                      <p className="text-sm text-muted-foreground">
                        基于你的简历，全网匹配最合适的岗位
                      </p>
                    </div>
                  </Link>
                  <Link href="/projects">
                    <div className="border border-border p-6 hover:border-accent transition-colors duration-600">
                      <h3 className="editorial-title text-lg mb-2">项目孵化</h3>
                      <p className="text-sm text-muted-foreground">
                        协助你做出能写进简历的 真实项目
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
