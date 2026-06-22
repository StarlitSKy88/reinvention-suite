import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * 首页 — japanese-ma-minimalism
 *
 * 设计哲学：
 * - 巨大 hero 标题（clamp 3.5-9rem）
 * - 不对称布局（左侧内容，右侧大量留白）
 * - 区段间距 ≥ py-32
 * - 朱红强调色最多 1 次
 * - 无圆角按钮（编辑感文字链接）
 */

export default function HomePage() {
  return (
    <main className="bg-background">
      {/* ========== Hero：不对称布局 ========== */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* 朱红强调：极大背景数字（每个主要区段一个）*/}
        <span
          aria-hidden
          className="absolute top-12 right-8 text-[20vw] font-light text-foreground/[0.03] leading-none select-none pointer-events-none"
        >
          01
        </span>

        <div className="ma-layout w-full">
          <div className="ma-bleed-right py-32">
            <div className="flex flex-col gap-12 max-w-prose">
              {/* 编号标注 */}
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <span className="meta-label">二零二六 · 再出発</span>
              </div>

              {/* Hero 标题 — 巨大衬线 */}
              <h1 className="hero-display editorial-title">
                三十五歳以上、<br />
                二十五のふりを<br />
                しなくていい
              </h1>

              {/* 副标 */}
              <p className="text-lg text-muted-foreground max-w-reading leading-relaxed">
                再出発は、三十五歳以上の求職者専用の無料アシスタント。
                全網から企業を探し、不足を補い、再就職までの期間を八ヶ月から四ヶ月に縮める。
              </p>

              {/* 编辑感 CTA（无填充）*/}
              <div className="flex items-center gap-12 pt-6">
                <Link href="#features">
                  <Button variant="accent">無料で始める</Button>
                </Link>
                <Link href="/about">
                  <Button variant="editorial">詳しく見る</Button>
                </Link>
              </div>

              {/* 元数据 */}
              <div className="meta-label pt-12 border-t border-border mt-12 grid grid-cols-3 gap-8">
                <div>
                  <div className="text-foreground/60 text-[10px]">完全無料</div>
                  <div className="mt-1">料金なし</div>
                </div>
                <div>
                  <div className="text-foreground/60 text-[10px]">個人情報保護</div>
                  <div className="mt-1">原文非送信</div>
                </div>
                <div>
                  <div className="text-foreground/60 text-[10px]">運営主体</div>
                  <div className="mt-1">政府購買</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      {/* ========== Features：3fr 2fr 不对称 ========== */}
      <section id="features" className="py-section scroll-mt-20">
        <span
          aria-hidden
          className="absolute right-8 text-[20vw] font-light text-foreground/[0.03] leading-none select-none pointer-events-none"
        >
          02
        </span>

        <div className="ma-layout">
          <div className="ma-full grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-24">
            {/* 左侧：标题 */}
            <div className="md:col-span-2 flex flex-col gap-8">
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <span className="meta-label">四つの柱</span>
              </div>
              <h2 className="editorial-title text-display-sm">
                私たちが<br />
                すること
              </h2>
            </div>

            {/* 右侧：4 个特性（不对称布局）*/}
            <div className="md:col-span-3 flex flex-col gap-16">
              <Feature
                num="I"
                title="全網マッチング"
                desc="ボス直聘に留まらず、企業の公式サイト、業界コミュニティ、人材紹介の全てから、最適な求人を見つける。"
              />
              <Feature
                num="II"
                title="履歴書の最適化"
                desc="AI 反事実改写 + 年齢ブラインド + 差別トリガー検出。AI は翻訳するだけで、創作しない。"
              />
              <Feature
                num="III"
                title="実プロジェクト孵化"
                desc="AI が捏造したプロジェクトではなく、本当にあなたがやり遂げたプロジェクト。OSS、執筆、MVP——履歴書に書ける実物を作る。"
              />
              <Feature
                num="IV"
                title="プライバシー保護"
                desc="履歴書の原文はブラウザのみ。PII は自動匿名化。個人情報保護法準拠。"
              />
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      {/* ========== 引用 / 数据引用 ========== */}
      <section className="py-section">
        <div className="ma-layout">
          <div className="ma-bleed-left">
            <div className="ml-[12vw] pl-6 border-l border-accent max-w-prose">
              <div className="meta-label mb-8">数字で見る</div>
              <p className="text-3xl md:text-5xl font-light editorial-title leading-tight">
                求職期間を<br />
                <span className="text-accent">八ヶ月</span>
                <span className="text-foreground/40"> から </span>
                <span className="text-accent">四ヶ月</span>
                <span className="text-foreground/40"> へ</span>
              </p>
              <p className="mt-12 text-muted-foreground text-sm">
                — 中華人民共和国人力資源和社会保障部『二零二六年 第三季度 報告』
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      {/* ========== 为什么免费 ========== */}
      <section className="py-section">
        <div className="ma-layout">
          <div className="ma-full grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-24">
            <div className="md:col-span-2">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-8 h-px bg-accent" />
                <span className="meta-label">政府購買</span>
              </div>
              <h2 className="editorial-title text-display-sm">
                なぜ<br />
                無料なのか
              </h2>
            </div>

            <div className="md:col-span-3">
              <p className="text-base leading-loose text-foreground/80 mb-8">
                再出発は、各地の社会保険局による「再就職支援サービス」の一環として運営されています。
                ユーザーから料金を取る代わりに、政府から支援を受けています。
              </p>
              <p className="text-base leading-loose text-foreground/80 mb-12">
                私たちの目標は、三十五歳以上の失業者八千万人を、四ヶ月で再就職させること。
                それは商業 SaaS ではなく、公共サービスです。
              </p>
              <Link href="/about">
                <Button variant="editorial">運営理念を見る</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== Footer ========== */}
      <footer className="border-t border-border py-16">
        <div className="ma-layout">
          <div className="ma-full flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="meta-label">
              © 二〇二六 — 再出発 Reinvention Suite
            </div>
            <div className="flex gap-12 meta-label">
              <Link href="/gov-dashboard" className="hover:opacity-50 transition-opacity duration-600">
                政府用
              </Link>
              <Link href="/about" className="hover:opacity-50 transition-opacity duration-600">
                概要
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-2 meta-label pt-1">{num}</div>
      <div className="col-span-10 flex flex-col gap-3">
        <h3 className="editorial-title text-2xl font-light">{title}</h3>
        <p className="text-sm text-muted-foreground leading-loose">{desc}</p>
      </div>
    </div>
  );
}
