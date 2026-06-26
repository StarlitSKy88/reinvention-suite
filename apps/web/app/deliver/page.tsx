/**
 * 投递导航页 — 黑底白字红字点缀
 *
 * 根据公司名搜索官网投递入口
 * 找不到时给出兜底渠道
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface DeliveryPath {
  type: 'OFFICIAL_FORM' | 'EMAIL' | 'LINKEDIN' | 'AGENCY' | 'FALLBACK';
  url: string;
  instructions: string;
  fallbacks?: Array<{
    type: string;
    url: string;
    instructions: string;
  }>;
}

export default function DeliverPage() {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeliveryPath | null>(null);

  async function searchPath() {
    if (!companyName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/delivery/path?company=${encodeURIComponent(companyName)}`
      );
      const json = await res.json();
      if (json.success) setResult(json.data);
    } catch (err) {
      console.error('搜索失败', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-background min-h-screen">
      <section className="relative py-section">
        <span
          aria-hidden
          className="absolute top-12 right-8 text-[20vw] font-light text-accent/[0.06] leading-none select-none pointer-events-none"
        >
          04
        </span>

        <div className="ma-layout">
          <div className="ma-bleed-right">
            <div className="flex flex-col gap-12 max-w-prose">
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <Link href="/match/jobs" className="meta-label hover:opacity-50">
                  ← 返回匹配
                </Link>
              </div>

              <h1 className="editorial-title text-display-sm">
                投递<br />导航
              </h1>

              <p className="text-muted-foreground leading-relaxed">
                输入公司名，我们帮你找到<span className="text-accent">最直接的投递入口</span>。
                找不到官网入口？会给出 3-5 个候选渠道。
              </p>

              {/* 搜索框 */}
              <div className="flex gap-4 mt-8">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchPath()}
                  placeholder="公司名（如：字节跳动）"
                  className="flex-1 bg-transparent border border-border px-4 py-3 text-sm focus:border-accent focus:outline-none"
                />
                <Button
                  variant="accent"
                  onClick={searchPath}
                  disabled={loading || !companyName.trim()}
                >
                  {loading ? '搜索中…' : '搜索'}
                </Button>
              </div>

              {/* 结果 */}
              {result && (
                <div className="mt-8 border-t border-border pt-8">
                  <h2 className="editorial-title text-2xl mb-6">
                    {result.type === 'OFFICIAL_FORM'
                      ? '✓ 找到官网投递入口'
                      : '未找到官网入口，建议尝试：'}
                  </h2>

                  {result.type !== 'FALLBACK' && (
                    <div className="border border-accent p-6 mb-6">
                      <div className="meta-label text-accent">
                        {result.type}
                      </div>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg mt-2 block hover:text-accent transition-colors"
                      >
                        {result.url}
                      </a>
                      <p className="text-sm text-muted-foreground mt-2">
                        {result.instructions}
                      </p>
                    </div>
                  )}

                  {result.fallbacks && result.fallbacks.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <div className="meta-label">备选渠道</div>
                      {result.fallbacks.map((fb, i) => (
                        <div
                          key={i}
                          className="border border-border p-4 flex flex-col gap-2"
                        >
                          <div className="meta-label">{fb.type}</div>
                          <a
                            href={fb.url || '#'}
                            className="text-sm hover:text-accent transition-colors"
                          >
                            {fb.url || fb.instructions}
                          </a>
                          <p className="text-xs text-muted-foreground">
                            {fb.instructions}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
