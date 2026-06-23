/**
 * 岗位匹配页 — 黑底白字红字点缀
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: '岗位匹配 — 再出发',
};

export default function MatchJobsPage() {
  // Mock 数据（实际应该从 API 加载）
  const mockJobs = [
    {
      id: '1',
      title: 'AI 产品经理',
      company: '某 AI 创业公司',
      location: '北京',
      salary: '50-80K · 16薪',
      matchScore: 87,
      matchedKeywords: ['AI', '产品设计', '数据分析'],
      missingKeywords: ['LLM', 'Prompt Engineering'],
      source: 'BOSS 直聘',
    },
    {
      id: '2',
      title: '高级产品经理',
      company: '某 SaaS 公司',
      location: '上海',
      salary: '40-60K · 14薪',
      matchScore: 78,
      matchedKeywords: ['产品设计', 'B 端', '增长'],
      missingKeywords: ['SaaS', 'PLG'],
      source: '拉勾',
    },
    {
      id: '3',
      title: '产品总监',
      company: '某传统企业数字化部门',
      location: '深圳',
      salary: '60-90K · 14薪',
      matchScore: 72,
      matchedKeywords: ['团队管理', '战略', '数字化'],
      missingKeywords: ['AI', '数据驱动'],
      source: '猎聘',
    },
  ];

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
                  href="/resume/analyze"
                  className="meta-label hover:opacity-50"
                >
                  ← 返回分析
                </Link>
              </div>

              <h1 className="editorial-title text-display-sm">
                全网<br />岗位匹配
              </h1>

              <p className="text-muted-foreground leading-relaxed">
                基于你的简历和求职目标，全网（公司官网 + Boss + 拉勾 + 猎聘）
                匹配的 Top 20 岗位。
              </p>

              {/* 岗位列表 */}
              <div className="flex flex-col gap-6 mt-8">
                {mockJobs.map((job) => (
                  <article
                    key={job.id}
                    className="border-t border-border pt-6 group"
                  >
                    <div className="flex items-start justify-between gap-6 mb-3">
                      <div>
                        <h3 className="editorial-title text-xl font-light">
                          {job.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {job.company} · {job.location} · {job.salary}
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
                        {job.matchedKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="text-xs px-2 py-1 border border-accent text-accent"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="meta-label">待补全</span>
                        {job.missingKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="text-xs px-2 py-1 border border-border text-muted-foreground"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex gap-4">
                      <Button variant="accent">查看详情</Button>
                      <Button variant="ghost">查看差距分析</Button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="meta-label text-muted-foreground/60 mt-12">
                显示 Top 3，共匹配 23 个岗位（mock 数据）
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
