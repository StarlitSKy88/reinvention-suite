import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * 关于我们 — japanese-ma-minimalism
 *
 * 编辑感：左侧文字流，右侧大量留白
 * 每个段落 max-width: 58ch
 */

export const metadata = {
  title: '概要 — 再出発',
};

export default function AboutPage() {
  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center py-section">
        <span
          aria-hidden
          className="absolute top-12 right-8 text-[20vw] font-light text-foreground/[0.03] leading-none select-none pointer-events-none"
        >
          01
        </span>

        <div className="ma-layout w-full">
          <div className="ma-bleed-right">
            <div className="flex flex-col gap-12 max-w-prose">
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <span className="meta-label">概要</span>
              </div>

              <h1 className="editorial-title text-display-sm">
                三十五歳以上は、<br />
                終わりではなく<br />
                始まりである
              </h1>
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      {/* 我们的故事 */}
      <section className="py-section">
        <div className="ma-layout">
          <div className="ma-full grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-24">
            <div className="md:col-span-2">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-8 h-px bg-accent" />
                <span className="meta-label">物語</span>
              </div>
              <h2 className="editorial-title text-3xl font-light">私たちの物語</h2>
            </div>

            <div className="md:col-span-3 flex flex-col gap-8 max-w-reading">
              <p className="leading-loose text-foreground/85">
                二〇二六年、中国では三十五歳から五十歳の失業者が八千万人に達している。
                これらの人々は豊富な経験、成熟した判断力、安定的な人脈を持っている。
                しかし年齢差別、履歴書の一目却下、何が足りないかわからないという理由で、
                求職を繰り返し失敗している。
              </p>
              <p className="leading-loose text-foreground/85">
                再出発は、各地の社会保険局による「再就職支援サービス」の一環として運営される無料ツールである。
                ユーザーから料金を取るのではなく、政府の「安定雇用 KPI」を支援する。
                三十五歳以上の失業者は、無料で全ての機能を利用できる。
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      {/* 对 35+ 的承诺 */}
      <section className="py-section">
        <div className="ma-layout">
          <div className="ma-bleed-left">
            <div className="ml-[12vw] pl-6 border-l border-accent max-w-prose">
              <div className="meta-label mb-8">七つの誓い</div>
              <h2 className="editorial-title text-3xl font-light mb-12">
                三十五歳以上への<br />私たちの誓い
              </h2>

              <div className="flex flex-col gap-6 text-sm">
                <Promise>I. 完全無料、隠れた料金なし</Promise>
                <Promise>II. 自動継続課金の罠なし（業界の常習、私たちは行わない）</Promise>
                <Promise>III. AI 改写は数字・プロジェクト・スキルを捏造しない</Promise>
                <Promise>IV. 履歴書の原文をサーバーにアップロードしない</Promise>
                <Promise>V. ワンクリックで全データを削除</Promise>
                <Promise>VI. 第三者へユーザーデータを販売しない</Promise>
                <Promise>VII. 迷惑電話はしない（業界の常習、私たちは行わない）</Promise>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      {/* To-G 合作 */}
      <section className="py-section">
        <div className="ma-layout">
          <div className="ma-full grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-24">
            <div className="md:col-span-2">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-8 h-px bg-accent" />
                <span className="meta-label">対政府</span>
              </div>
              <h2 className="editorial-title text-3xl font-light">
                政府への<br />協業モデル
              </h2>
            </div>

            <div className="md:col-span-3 flex flex-col gap-8 max-w-reading">
              <p className="leading-loose text-foreground/85">
                再出発は、各地の社会保険局「再就職支援サービス」の購買支援を受けている。
                もしあなたが政府就業サービス部門に属し、あなたの管轄区で試運用したい場合は、
                お問い合わせください：gov@reinvention.example
              </p>
              <p className="leading-loose text-foreground/85">
                私たちは既に街道、区県、城市の三级政府に再就職サービスデータボードを提供している。
                カバー率、稼働率、再就職成功率、NPS 等の核心指標を含む。
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      {/* CTA */}
      <section className="py-section text-center">
        <div className="ma-layout">
          <div className="ma-full flex flex-col items-center gap-12">
            <h2 className="editorial-title text-display-sm">始めましょう</h2>
            <Link href="/">
              <Button variant="accent">無料で始める</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-16">
        <div className="ma-layout">
          <div className="ma-full flex justify-between items-center">
            <div className="meta-label">© 二〇二六 — 再出発</div>
            <Link href="/" className="meta-label hover:opacity-50 transition-opacity duration-600">
              ホーム
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Promise({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-border">
      <div className="meta-label pt-0.5 shrink-0">✓</div>
      <div className="leading-relaxed text-foreground/85">{children}</div>
    </div>
  );
}
