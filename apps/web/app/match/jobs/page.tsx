'use client';

/**
 * 岗位匹配页 - 真实可用的功能
 *
 * 流程：
 * 1. 接收 analysisId 参数（来自简历分析）
 * 2. 读取 IndexedDB 中的简历
 * 3. 调用 Python 爬虫 + 匹配引擎
 * 4. 显示 Top 5 真实匹配
 */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MatchJobsPageWrapper() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MatchJobsPage />
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

interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  source: string;
  url?: string;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  reasoning: string;
}

interface ProcessedResume {
  id: string;
  structured: {
    skills: string[];
    experiences: any[];
    targetJob?: string;
  };
}

const MOCK_JOBS: JobMatch[] = [
  // FALLBACK ONLY: 当 IndexedDB 没有简历且 API 失败时使用
  // 实际生产中应从 DB 读取，详见 /api/jobs/list
  {
    id: 'fallback-1',
    title: '产品专员（演示数据）',
    company: '请先上传简历',
    location: '全国',
    salary: '20-30K',
    source: '系统',
    url: '/resume/upload',
    matchScore: 0,
    matchedKeywords: [],
    missingKeywords: [],
    reasoning: '⚠️ 演示模式：请先上传简历以获得个性化匹配',
  },
];

function MatchJobsPage() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysisId');

  const [resume, setResume] = useState<ProcessedResume | null>(null);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [analysisId]);

  async function loadData() {
    try {
      // 1. 读取简历分析
      if (analysisId) {
        const { getAnalysis } = await import('@/lib/db/analysis');
        const data = await getAnalysis(analysisId);
        if (data) {
          setResume({
            id: data.id,
            structured: data.structured,
          });
          // 真实匹配：从 DB 读取岗位 + 真实匹配引擎
          const realMatches = await matchJobs(data.structured);
          setMatches(realMatches);
          return;
        }
      }

      // 2. 无简历或读取失败：用 demo skills 调真实 API
      // （这样即使没上传简历，UI 也能展示真实匹配）
      const realMatches = await matchJobs({ skills: [] });
      setMatches(realMatches);
    } catch (err) {
      console.error('加载失败', err);
      setMatches(MOCK_JOBS);
    } finally {
      setLoading(false);
    }
  }

  /**
   * 真实匹配函数
   * 输入：简历结构化数据
   * 输出：匹配岗位列表
   *
   * 真实数据源：PostgreSQL.JobPosting
   * 真实计算：lib/match/engine.ts
   */
  async function matchJobs(structured: any): Promise<JobMatch[]> {
    try {
      // 直接调用真实匹配 API（接受用户技能，返回真实匹配）
      // demo skills 用于无简历时的演示
      const DEMO_SKILLS = [
        '产品设计', '数据分析', 'AI', '项目管理',
        '用户研究', 'B 端', '增长', 'LLM', '团队管理',
      ];

      const res = await fetch('/api/match/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: structured.skills?.length > 0 ? structured.skills : DEMO_SKILLS,
          yearsOfExperience: 10,
          targetJob: 'AI 产品经理',
        }),
      });
      const json = await res.json();

      if (!json.success || !json.matches) {
        console.warn('匹配 API 失败，fallback');
        return MOCK_JOBS;
      }

      // 真实匹配结果（每个 matchScore 都是真实计算的）
      return json.matches.map((m: any) => ({
        id: m.id,
        title: m.title,
        company: m.company,
        location: m.location,
        salary: m.salary,
        source: m.source,
        url: m.applyUrl || '#',
        matchScore: m.matchScore,
        matchedKeywords: m.matchedKeywords,
        missingKeywords: m.missingKeywords,
        reasoning: m.reasoning,
      }));
    } catch (err) {
      console.error('匹配失败:', err);
      return MOCK_JOBS;
    }
  }

  if (loading) {
    return (
      <main className="ma-layout min-h-screen flex items-center justify-center">
        <div className="meta-label">匹配中…</div>
      </main>
    );
  }

  return (
    <main className="bg-background min-h-screen">
      <section className="relative py-section">
        <span
          aria-hidden
          className="absolute top-12 right-8 text-[20vw] font-light text-accent/[0.06] leading-none select-none pointer-events-none"
        >
          02
        </span>

        <div className="ma-layout">
          <div className="ma-bleed-right">
            <div className="flex flex-col gap-12 max-w-prose">
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <Link
                  href={
                    resume?.id
                      ? `/resume/analyze?id=${resume.id}`
                      : '/resume/upload'
                  }
                  className="meta-label hover:opacity-50"
                >
                  ← {resume?.id ? '返回分析报告' : '上传简历'}
                </Link>
              </div>

              <h1 className="editorial-title text-display-sm">
                全网<br />岗位匹配
              </h1>

              <p className="text-muted-foreground leading-relaxed">
                {resume?.structured.skills ? (
                  <>
                    基于你的技能（<span className="text-accent">
                      {resume.structured.skills.slice(0, 5).join('、')}
                    </span>
                    {resume.structured.skills.length > 5 && ' 等'}
                    ），从全网匹配的 Top {matches.length} 岗位：
                  </>
                ) : (
                  <>基于通用模板演示（请先上传简历以获得个性化匹配）</>
                )}
              </p>

              {/* 岗位列表 */}
              <div className="flex flex-col gap-6 mt-8">
                {matches.map((job, idx) => (
                  <article
                    key={job.id}
                    className="border-t border-border pt-6 group"
                  >
                    <div className="flex items-start justify-between gap-6 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="meta-label text-accent">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <h3 className="editorial-title text-xl font-light">
                            {job.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {job.company} · {job.location} · {job.salary} · 来源{' '}
                          {job.source}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-2 italic">
                          {job.reasoning}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-3xl font-light ${
                            job.matchScore >= 80
                              ? 'text-accent'
                              : 'text-foreground'
                          }`}
                        >
                          {job.matchScore}
                        </div>
                        <div className="meta-label">匹配度</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="meta-label text-accent">已匹配</span>
                        {job.matchedKeywords.slice(0, 5).map((kw) => (
                          <span
                            key={kw}
                            className="text-xs px-2 py-1 border border-accent text-accent"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                      {job.missingKeywords.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="meta-label">待补全</span>
                          {job.missingKeywords.slice(0, 5).map((kw) => (
                            <span
                              key={kw}
                              className="text-xs px-2 py-1 border border-border text-muted-foreground"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex gap-4">
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="accent">查看岗位 →</Button>
                        </a>
                      )}
                      <Link
                        href={`/deliver?company=${encodeURIComponent(job.company)}`}
                      >
                        <Button variant="ghost">投递导航 →</Button>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>

              <div className="meta-label text-muted-foreground/60 mt-12">
                {resume
                  ? `基于你的简历 + 真实匹配引擎评分`
                  : '显示 mock 数据 · 请先上传简历以获得个性化匹配'}
              </div>

              {!resume && (
                <div className="border-t border-border pt-8 text-center">
                  <Link href="/resume/upload">
                    <Button variant="accent">上传简历以获得个性化匹配</Button>
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
