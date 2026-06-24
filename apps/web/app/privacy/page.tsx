/**
 * 隐私政策 + 数据保护页面
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const USER_ID = 'demo-user';

export default function PrivacyPage() {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function handleExport() {
    setExporting(true);
    setMessage(null);
    try {
      const { getUserAnalyses } = await import('@/lib/db/analysis');
      const data = await getUserAnalyses(USER_ID);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reinvention-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({
        type: 'success',
        text: `已导出 ${data.length} 条记录`,
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: `导出失败: ${(err as Error).message}`,
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (!confirm('确定要删除所有数据吗？此操作不可恢复。')) return;

    setDeleting(true);
    setMessage(null);
    try {
      const { deleteAllUserData } = await import('@/lib/db/analysis');
      const count = await deleteAllUserData(USER_ID);
      setMessage({
        type: 'success',
        text: `已删除 ${count} 条记录`,
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: `删除失败: ${(err as Error).message}`,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="bg-background min-h-screen">
      <section className="relative py-section">
        <span
          aria-hidden
          className="absolute top-12 right-8 text-[20vw] font-light text-accent/[0.06] leading-none select-none pointer-events-none"
        >
          IV
        </span>

        <div className="ma-layout">
          <div className="ma-bleed-right">
            <div className="flex flex-col gap-12 max-w-prose">
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <Link href="/" className="meta-label hover:opacity-50">
                  ← 返回首页
                </Link>
              </div>

              <h1 className="editorial-title text-display-sm">
                隐私<br />保护
              </h1>

              <p className="text-muted-foreground leading-relaxed">
                你的简历原文只在你的浏览器内处理，
                我们严格遵守《个保法》要求。
              </p>

              {/* 四大原则 */}
              <div className="flex flex-col gap-6 mt-8">
                <Principle
                  num="I"
                  title="零上传"
                  desc="简历原文、PII 信息不发送到任何服务器，全程在你的浏览器内处理。"
                />
                <Principle
                  num="II"
                  title="自动脱敏"
                  desc="手机号、邮箱、身份证、银行卡号等敏感字段在浏览器内自动脱敏后才用于 LLM 调用。"
                />
                <Principle
                  num="III"
                  title="反幻觉"
                  desc="AI 改写严格基于事实库，标注每个 bullet 的来源，禁止编造数字、项目、技能。"
                />
                <Principle
                  num="IV"
                  title="数据主权"
                  desc="一键导出你的所有数据，一键删除所有数据，删除后无法恢复。"
                />
              </div>

              {/* 数据控制 */}
              <section className="border-t border-border pt-8 mt-8">
                <h2 className="meta-label mb-6 text-accent">数据控制</h2>

                <div className="flex flex-col gap-4">
                  <DataAction
                    title="导出我的数据"
                    desc="下载你的所有简历分析记录（JSON 格式）"
                    buttonText="导出"
                    loading={exporting}
                    onClick={handleExport}
                  />
                  <DataAction
                    title="删除所有数据"
                    desc="永久删除你的所有简历和记录，此操作不可恢复"
                    buttonText="删除"
                    loading={deleting}
                    onClick={handleDelete}
                    danger
                  />
                </div>

                {message && (
                  <div
                    className={`mt-6 p-4 border text-sm ${
                      message.type === 'success'
                        ? 'border-accent text-accent'
                        : 'border-red-500 text-red-500'
                    }`}
                  >
                    {message.type === 'success' ? '✓ ' : '✗ '}
                    {message.text}
                  </div>
                )}
              </section>

              {/* 详细政策 */}
              <section className="border-t border-border pt-8">
                <h2 className="editorial-title text-2xl mb-6">详细隐私政策</h2>

                <div className="flex flex-col gap-6 text-sm text-foreground/85 leading-relaxed">
                  <PolicySection title="1. 我们收集什么">
                    <p>
                      我们在以下情况下收集数据：
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>你上传的简历文件（仅在你的浏览器内处理）</li>
                      <li>你填写的事实库（用于反幻觉改写）</li>
                      <li>脱敏后的结构化数据（本地 IndexedDB）</li>
                      <li>行为埋点（匿名，可选）</li>
                    </ul>
                  </PolicySection>

                  <PolicySection title="2. 我们不收集什么">
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>简历原文不上传到任何服务器</li>
                      <li>手机号/邮箱/身份证在客户端脱敏后才使用</li>
                      <li>你的浏览记录不上传到第三方</li>
                    </ul>
                  </PolicySection>

                  <PolicySection title="3. 数据存储">
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>本地：IndexedDB（浏览器）</li>
                      <li>服务端（如启用）：PostgreSQL + AES-256-GCM 加密</li>
                      <li>传输：TLS 1.3</li>
                      <li>留存：直到你删除</li>
                    </ul>
                  </PolicySection>

                  <PolicySection title="4. 你的权利">
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>随时导出所有数据（JSON 格式）</li>
                      <li>随时删除所有数据（不可恢复）</li>
                      <li>查看 AI 如何使用你的数据</li>
                      <li>关闭行为埋点</li>
                    </ul>
                  </PolicySection>

                  <PolicySection title="5. 联系我们">
                    <p className="text-muted-foreground">
                      如有隐私问题，请联系：privacy@reinvention.example
                    </p>
                  </PolicySection>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Principle({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="border-t border-border pt-6 grid grid-cols-12 gap-6">
      <div className="col-span-1 meta-label text-accent pt-1">{num}</div>
      <div className="col-span-11 flex flex-col gap-2">
        <h3 className="editorial-title text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function DataAction({
  title,
  desc,
  buttonText,
  loading,
  onClick,
  danger,
}: {
  title: string;
  desc: string;
  buttonText: string;
  loading: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border border-border p-4">
      <div>
        <h3 className="editorial-title text-base font-light">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
      </div>
      <Button
        variant={danger ? 'editorial' : 'editorial'}
        onClick={onClick}
        disabled={loading}
        className={danger ? 'hover:opacity-100' : ''}
      >
        {loading ? '处理中…' : buttonText}
      </Button>
    </div>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="meta-label mb-3">{title}</h3>
      {children}
    </div>
  );
}
