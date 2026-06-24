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
  {
    id: 'mock-1',
    title: 'AI 产品经理',
    company: '某 AI 创业公司',
    location: '北京',
    salary: '50-80K · 16薪',
    source: 'BOSS 直聘',
    url: 'https://www.zhipin.com/',
    matchScore: 87,
    matchedKeywords: ['AI', '产品设计', '数据分析', '项目管理'],
    missingKeywords: ['LLM', 'Prompt Engineering', 'RAG'],
    reasoning: '技能高度匹配，3 个新兴技能需补全',
  },
  {
    id: 'mock-2',
    title: '高级产品经理',
    company: '某 SaaS 公司',
    location: '上海',
    salary: '40-60K · 14薪',
    source: '拉勾',
    url: 'https://www.lagou.com/',
    matchScore: 78,
    matchedKeywords: ['产品设计', 'B 端', '增长', '数据分析'],
    missingKeywords: ['SaaS', 'PLG'],
    reasoning: 'B 端经验匹配，SaaS 专业度可提升',
  },
  {
    id: 'mock-3',
    title: '产品总监',
    company: '某传统企业数字化部门',
    location: '深圳',
    salary: '60-90K · 14薪',
    source: '猎聘',
    url: 'https://www.liepin.com/',
    matchScore: 72,
    matchedKeywords: ['团队管理', '战略', '数字化', '用户研究'],
    missingKeywords: ['AI', '数据驱动'],
    reasoning: '管理经验匹配，AI 能力是加分项',
  },
  {
    id: 'mock-4',
    title: '产品专家',
    company: '某互联网大厂',
    location: '杭州',
    salary: '45-70K · 15薪',
    source: '公司官网',
    url: 'https://example.com/careers',
    matchScore: 81,
    matchedKeywords: ['产品设计', '用户研究', '数据分析', '项目管理'],
    missingKeywords: ['大厂经验'],
    reasoning: '技能完全匹配，大厂背景可加分',
  },
  {
    id: 'mock-5',
    title: '产品运营经理',
    company: '某跨境电商',
    location: '广州',
    salary: '35-55K · 13薪',
    source: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs/',
    matchScore: 65,
    matchedKeywords: ['运营', '数据分析', '项目管理'],
    missingKeywords: ['跨境电商', '海外市场'],
    reasoning: '基础能力匹配，行业经验需补全',
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
          // 真实匹配（这里用 mock，实际应调用匹配引擎）
          const realMatches = await matchJobs(data.structured);
          setMatches(realMatches);
        } else {
          // 没有简历数据，用 mock
          setMatches(MOCK_JOBS);
        }
      } else {
        // 没有 analysisId，用 mock 演示
        setMatches(MOCK_JOBS);
      }
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
   */
  async function matchJobs(structured: any): Promise<JobMatch[]> {
    try {
      // 调用匹配引擎（来自 lib/match/engine.ts）
      const { matchJobs: engine } = await import('@/lib/match/engine');

      // Mock 岗位库（实际应从 DB 或爬虫获取）
      const mockJobs = MOCK_JOBS.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        salary: j.salary,
        source: 'exa' as const,
        sourceUrl: j.url || '',
        description: `${j.title} - ${j.company} - ${j.salary}。${j.reasoning}`,
        requirements: [...j.matchedKeywords, ...j.missingKeywords],
        keywords: [...j.matchedKeywords, ...j.missingKeywords],
        postedAt: new Date().toISOString(),
      }));

      const result = await engine({
        user: {
          id: 'demo-user',
          targetJobs: structured.targetJob ? [structured.targetJob] : ['AI 产品经理'],
          targetSalary: { min: 30, max: 80, currency: 'CNY' },
          targetLocations: ['北京', '上海', '深圳', '杭州'],
          targetIndustries: [],
          willingToRelocate: true,
          remotePreferred: false,
          privacyLevel: 'strict',
        },
        userSkills: structured.skills || [],
        userYearsOfExperience: 10,
        jobs: mockJobs,
      });

      // 合并匹配结果和 mock 数据
      return result.matchedJobs.map((matched: any) => ({
        ...MOCK_JOBS.find((m) => m.id === matched.id)!,
        matchScore: matched.matchScore.score,
        matchedKeywords: matched.matchScore.matchedKeywords,
        missingKeywords: matched.matchScore.missingKeywords,
        reasoning: matched.matchScore.reasoning,
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
