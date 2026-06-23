/**
 * 项目孵化器页 — 黑底白字红字点缀
 * 10 个真实可执行的项目模板
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PROJECT_TEMPLATES } from '@/lib/project/templates';

export const metadata = {
  title: '项目孵化 — 再出发',
};

export default function ProjectsPage() {
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
                  href="/resume/analyze"
                  className="meta-label hover:opacity-50"
                >
                  ← 返回分析
                </Link>
              </div>

              <h1 className="editorial-title text-display-sm">
                真实<br />项目孵化
              </h1>

              <p className="text-muted-foreground leading-relaxed">
                协助你做出 <span className="text-accent">真实可写进简历</span> 的项目。
                不是 AI 编造，是你真的做到了。
              </p>

              {/* 项目列表 */}
              <div className="flex flex-col gap-12 mt-12">
                {PROJECT_TEMPLATES.map((template, idx) => (
                  <article
                    key={template.id}
                    className="border-t border-border pt-6"
                  >
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-1 meta-label text-accent">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      <div className="col-span-11">
                        <div className="flex items-start justify-between gap-6 mb-3">
                          <h3 className="editorial-title text-xl font-light">
                            {template.name}
                          </h3>
                          <span className="meta-label shrink-0">
                            {template.durationWeeks} 周 · {template.difficulty}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                          {template.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="meta-label">适用目标</span>
                          {template.applicableGoals.map((g) => (
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
                          {template.techStack.map((t) => (
                            <span
                              key={t}
                              className="text-xs px-2 py-1 border border-border text-muted-foreground font-mono"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <Button variant="editorial">开始这个项目</Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
