'use client';

/**
 * 项目孵化器 - 真实 AI 推荐
 *
 * 基于用户简历 + 目标岗位，AI 推荐最合适的 3-5 个项目模板
 */

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { ProjectTemplate } from '@reinvention/types';

export default function ProjectsPageWrapper() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProjectsPage />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <main className="ma-layout min-h-screen flex items-center justify-center">
      <div className="meta-label">推荐中…</div>
    </main>
  );
}

interface ProcessedResume {
  id: string;
  structured: {
    targetJob?: string;
    skills: string[];
  };
}

function ProjectsPage() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysisId');

  const [resume, setResume] = useState<ProcessedResume | null>(null);
  const [recommendations, setRecommendations] = useState<Array<{
    template: ProjectTemplate;
    reasoning: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, [analysisId]);

  async function loadRecommendations() {
    try {
      let currentResume: ProcessedResume | null = null;

      if (analysisId) {
        const { getAnalysis } = await import('@/lib/db/analysis');
        const data = await getAnalysis(analysisId);
        if (data) {
          currentResume = {
            id: data.id,
            structured: data.structured,
          };
        }
      }

      setResume(currentResume);

      // 加载项目模板 + AI 推荐
      const { PROJECT_TEMPLATES } = await import('@/lib/project/templates');

      const targetJob =
        currentResume?.structured.targetJob || 'AI 产品经理';
      const userSkills = currentResume?.structured.skills || [];

      // 调用推荐引擎
      const { recommendProjectsForUser } = await import(
        '@/lib/project/recommender'
      );

      const result = await recommendProjectsForUser({
        userId: currentResume?.id || 'demo-user',
        resume: currentResume?.structured
          ? ({
              userId: currentResume.id,
              name: '',
              contact: { email: '', phone: '', location: '' },
              experiences: [],
              education: [],
              skills: userSkills,
              projects: [],
              createdAt: '',
              updatedAt: '',
              version: 1,
            } as any)
          : ({} as any),
        factBase: {
          userId: currentResume?.id || 'demo-user',
          projects: [],
          skills: userSkills.map((s) => ({
            name: s,
            level: 'intermediate' as const,
            yearsOfExperience: 5,
            lastUsed: new Date().toISOString().split('T')[0],
          })),
          experiences: [],
          summary: '',
          userConfirmed: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        targetJob,
        useLLM: false,
      });

      setRecommendations(
        result.aiRecommendations || result.templates.map((t) => ({
          template: t,
          reasoning: '',
        }))
      );
    } catch (err) {
      console.error('加载推荐失败', err);
      // fallback: 使用规则引擎
      const { PROJECT_TEMPLATES } = await import('@/lib/project/templates');
      const { recommendProjects } = await import('@/lib/project/templates');
      const recommended = recommendProjects(
        resume?.structured.targetJob || 'AI 产品经理',
        resume?.structured.skills || []
      );
      setRecommendations(recommended.map((t) => ({ template: t, reasoning: '' })));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="ma-layout min-h-screen flex items-center justify-center">
        <div className="meta-label">推荐中…</div>
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
          03
        </span>

        <div className="ma-layout">
          <div className="ma-bleed-right">
            <div className="flex flex-col gap-12 max-w-prose">
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <Link
                  href={resume?.id ? `/resume/analyze?id=${resume.id}` : '/'}
                  className="meta-label hover:opacity-50"
                >
                  ← {resume?.id ? '返回分析报告' : '返回首页'}
                </Link>
              </div>

              <h1 className="editorial-title text-display-sm">
                真实<br />项目孵化
              </h1>

              <p className="text-muted-foreground leading-relaxed">
                {resume ? (
                  <>
                    基于你的<span className="text-accent">简历和目标岗位</span>，
                    AI 推荐最合适的 {recommendations.length} 个项目模板
                  </>
                ) : (
                  <>展示 10 个真实项目模板。请先上传简历获得个性化推荐。</>
                )}
              </p>

              {/* 项目推荐列表 */}
              <div className="flex flex-col gap-12 mt-12">
                {recommendations.map((rec, idx) => (
                  <article
                    key={rec.template.id}
                    className="border-t border-border pt-6"
                  >
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-1 meta-label text-accent">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div className="col-span-11">
                        <div className="flex items-start justify-between gap-6 mb-3">
                          <h3 className="editorial-title text-xl font-light">
                            {rec.template.name}
                          </h3>
                          <span className="meta-label shrink-0">
                            {rec.template.durationWeeks} 周 · {rec.template.difficulty}
                          </span>
                        </div>

                        {rec.reasoning && (
                          <p className="text-sm text-accent/80 leading-relaxed mb-3 italic">
                            💡 {rec.reasoning}
                          </p>
                        )}

                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          {rec.template.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="meta-label">适用目标</span>
                          {rec.template.applicableGoals.map((g) => (
                            <span
                              key={g}
                              className="text-xs px-2 py-1 border border-border text-muted-foreground"
                            >
                              {g}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-6">
                          <span className="meta-label">技术栈</span>
                          {rec.template.techStack.map((t) => (
                            <span
                              key={t}
                              className="text-xs px-2 py-1 border border-border text-muted-foreground font-mono"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-4">
                          <Button variant="accent">开始这个项目</Button>
                          <Button variant="ghost">查看详情</Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {!resume && (
                <div className="border-t border-border pt-8 text-center">
                  <p className="meta-label text-muted-foreground mb-4">
                    上传简历以获得 AI 个性化推荐
                  </p>
                  <Link href="/resume/upload">
                    <Button variant="accent">上传简历</Button>
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
