'use client';

/**
 * 简历分析报告 - 客户端组件
 * 从 IndexedDB 读取真实分析结果并展示
 */

import { useEffect, useState } from 'react';
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

export function ResumeAnalyzeClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [analysis, setAnalysis] = useState<ProcessedResume | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadAnalysis(id);
  }, [id]);

  async function loadAnalysis(analysisId: string) {
    try {
      const { getAnalysis } = await import('@/lib/db/analysis');
      const data = await getAnalysis(analysisId);
      setAnalysis(data);
    } catch (err) {
      console.error('加载分析失败', err);
    } finally {
      setLoading(false);
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

              {/* 文件信息 */}
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
                  total={100}
                />
                <ScoreCard
                  label="偏见风险"
                  value={analysis.discrim.overallRiskScore}
                  total={100}
                />
                <ScoreCard
                  label="综合评分"
                  value={totalRiskScore}
                  total={100}
                />
              </div>

              {/* 年龄去敏 */}
              {analysis.ageMask.detections.length > 0 && (
                <Section title={`年龄暴露风险（${analysis.ageMask.detections.length}）`}>
                  <div className="flex flex-col gap-4">
                    {analysis.ageMask.detections.map((d, i) => (
                      <RiskCard
                        key={i}
                        original={d.original}
                        rewritten={d.rewritten}
                        riskLevel={d.riskLevel}
                        explanation={d.reasoning}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {/* 反歧视 */}
              {analysis.discrim.detections.length > 0 && (
                <Section
                  title={`歧视触发风险（${analysis.discrim.detections.length}）`}
                >
                  <div className="flex flex-col gap-4">
                    {analysis.discrim.detections.map((d, i) => (
                      <RiskCard
                        key={i}
                        original={d.original}
                        rewritten={d.rewritten}
                        riskLevel={d.riskLevel}
                        explanation={`HR 心理：${d.hrPsychology}`}
                      />
                    ))}
                  </div>
                </Section>
              )}

              {/* 结构化预览 */}
              <Section title="简历基本信息（已脱敏）">
                <div className="border border-border p-6 flex flex-col gap-4 text-sm">
                  <div>
                    <span className="meta-label mr-3">姓名</span>
                    {analysis.structured.name}
                  </div>
                  <div>
                    <span className="meta-label mr-3">联系方式</span>
                    <span className="font-mono text-xs">
                      {analysis.structured.contact.email || '无'} ·{' '}
                      {analysis.structured.contact.phone || '无'}
                    </span>
                  </div>
                  <div>
                    <span className="meta-label mr-3">技能</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {analysis.structured.skills.map((s, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 border border-border"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="meta-label mr-3">工作经历</span>
                    <span>{analysis.structured.experiences.length} 段</span>
                  </div>
                  <div>
                    <span className="meta-label mr-3">项目经验</span>
                    <span>{analysis.structured.projects.length} 个</span>
                  </div>
                </div>
              </Section>

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
                        基于你的简历，全网（公司官网 + Boss + 拉勾 + 猎聘）匹配
                      </p>
                    </div>
                  </Link>
                  <Link href={`/projects?analysisId=${analysis.id}`}>
                    <div className="border border-border p-6 hover:border-accent transition-colors duration-600">
                      <h3 className="editorial-title text-lg mb-2">
                        项目孵化 →
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        推荐 10 个真实项目模板，4-12 周可写进简历
                      </p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* 警告 */}
              {analysis.meta.warnings.length > 0 && (
                <div className="border-t border-border pt-8">
                  <h3 className="meta-label mb-4 text-accent">注意事项</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {analysis.meta.warnings.map((w, i) => (
                      <li key={i}>⚠️ {w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ScoreCard({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const isHigh = value >= 60;
  return (
    <div className="bg-background p-6 flex flex-col gap-3">
      <div className="meta-label">{label}</div>
      <div
        className={`text-4xl font-light ${
          isHigh ? 'text-accent' : 'text-foreground'
        }`}
      >
        {value}
        <span className="text-base text-muted-foreground">/{total}</span>
      </div>
      <div className="h-1 bg-border">
        <div
          className={`h-full ${isHigh ? 'bg-accent' : 'bg-foreground'}`}
          style={{ width: `${(value / total) * 100}%` }}
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
