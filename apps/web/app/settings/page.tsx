/**
 * 设置中心 — 黑底白字红字点缀
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: '设置 — 再出发',
};

export default function SettingsPage() {
  return (
    <main className="bg-background min-h-screen">
      <section className="relative py-section">
        <span
          aria-hidden
          className="absolute top-12 right-8 text-[20vw] font-light text-accent/[0.06] leading-none select-none pointer-events-none"
        >
          05
        </span>

        <div className="ma-layout">
          <div className="ma-bleed-right">
            <div className="flex flex-col gap-12 max-w-prose">
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <Link
                  href="/"
                  className="meta-label hover:opacity-50 transition-opacity"
                >
                  ← 返回首页
                </Link>
              </div>

              <h1 className="editorial-title text-display-sm">设置</h1>

              <p className="text-muted-foreground leading-relaxed">
                管理你的 API 配置、个人资料、安全设置。
              </p>

              <div className="flex flex-col gap-6 mt-8">
                <SettingLink
                  href="/settings/api"
                  title="API 配置"
                  desc="配置 AI 大模型（MiniMax-M3 / Claude / DeepSeek）"
                />
                <SettingLink
                  href="/settings/profile"
                  title="个人资料"
                  desc="修改昵称、邮箱、求职目标"
                />
                <SettingLink
                  href="/settings/security"
                  title="安全设置"
                  desc="修改密码、启用二步验证、查看登录记录"
                />
                <SettingLink
                  href="/settings/privacy"
                  title="隐私与数据"
                  desc="导出个人数据、一键删除账户"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SettingLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <div className="border-t border-border py-8 group hover:bg-surface/30 transition-colors duration-600 -mx-4 px-4">
        <div className="flex items-center justify-between gap-8">
          <div>
            <h3 className="editorial-title text-xl font-light">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{desc}</p>
          </div>
          <span className="text-accent text-xs">→</span>
        </div>
      </div>
    </Link>
  );
}
