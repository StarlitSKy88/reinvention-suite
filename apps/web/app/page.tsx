import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * 首页 — 黑底白字红字点缀
 * 保留 Ma 极简主义布局（不对称 + 慷慨留白 + 编辑感标题）
 */

export default function HomePage() {
  return (
    <main className="bg-background">
      {/* ========== Hero：不对称布局 ========== */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* 红字背景数字（最大视觉锚点）*/}
        <span
          aria-hidden
          className="absolute top-12 right-8 text-[20vw] font-light text-accent/[0.06] leading-none select-none pointer-events-none"
        >
          01
        </span>

        <div className="ma-layout w-full">
          <div className="ma-bleed-right py-32">
            <div className="flex flex-col gap-12 max-w-prose">
              {/* 编号标注 + 红色短横线 */}
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <span className="meta-label text-accent">2026 · 再出发</span>
              </div>

              {/* 巨大 Hero 标题 */}
              <h1 className="hero-display editorial-title">
                三十五岁以上<br />
                不必再<br />
                <span className="text-accent">假装二十五</span>
              </h1>

              {/* 副标 */}
              <p className="text-lg text-muted-foreground max-w-reading leading-relaxed">
                再出发是一款专为三十五岁以上失业群体设计的免费再就业助手。
                全网匹配企业，主动协助弥补能力差距，
                让再就业周期从八个月缩短到四个月。
              </p>

              {/* 编辑感 CTA */}
              <div className="flex items-center gap-12 pt-6">
                <Link href="#features">
                  <Button variant="accent">免费开始</Button>
                </Link>
                <Link href="/about">
                  <Button variant="editorial">了解更多</Button>
                </Link>
              </div>

              {/* 元数据 */}
              <div className="meta-label pt-12 border-t border-border mt-12 grid grid-cols-3 gap-8">
                <div>
                  <div className="text-foreground/60 text-[10px]">完全免费</div>
                  <div className="mt-1">无隐藏收费</div>
                </div>
                <div>
                  <div className="text-foreground/60 text-[10px]">隐私保护</div>
                  <div className="mt-1">原文不上传</div>
                </div>
                <div>
                  <div className="text-foreground/60 text-[10px]">运营主体</div>
                  <div className="mt-1 text-accent">政府购买</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      {/* ========== Features：3fr 2fr 不对称 ========== */}
      <section id="features" className="py-section scroll-mt-20">
        <div className="ma-layout">
          <div className="ma-full grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-24">
            <div className="md:col-span-2 flex flex-col gap-8">
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <span className="meta-label">四大支柱</span>
              </div>
              <h2 className="editorial-title text-display-sm">
                我们<br />
                做什么
              </h2>
            </div>

            <div className="md:col-span-3 flex flex-col gap-16">
              <Feature
                num="I"
                title="全网匹配"
                desc="不只 Boss 直聘，搜遍公司官网、行业社群、猎头渠道，找到真正匹配你的岗位。"
              />
              <Feature
                num="II"
                title="简历优化"
                desc="AI 反幻觉改写 + 年龄去敏 + 反歧视检测。AI 只翻译不创作，保留你的真实业绩。"
              />
              <Feature
                num="III"
                title="真实项目孵化"
                desc="协助你做出真实可写进简历的项目（开源、写作、MVP、数据实验），而不是 AI 凭空编造。"
              />
              <Feature
                num="IV"
                title="隐私保护"
                desc="简历原文只在你的浏览器，PII 自动脱敏，符合《个保法》要求。"
              />
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      {/* ========== 引用样式：红色左竖线 ========== */}
      <section className="py-section">
        <div className="ma-layout">
          <div className="ma-bleed-left">
            <div className="ml-[12vw] pl-6 border-l-2 border-accent max-w-prose">
              <div className="meta-label mb-8 text-accent">数据对比</div>
              <p className="text-3xl md:text-5xl font-light editorial-title leading-tight">
                求职周期从<br />
                <span className="text-accent">八个月</span>
                <span className="text-foreground/40"> 到 </span>
                <span className="text-accent">四个月</span>
              </p>
              <p className="mt-12 text-muted-foreground text-sm">
                — 中华人民共和国人力资源和社会保障部《2026 年第三季度报告》
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
                <span className="meta-label">To-G 模式</span>
              </div>
              <h2 className="editorial-title text-display-sm">
                为什么<br />
                完全免费
              </h2>
            </div>

            <div className="md:col-span-3">
              <p className="text-base leading-loose text-foreground/80 mb-8">
                再出发由各地人社局"再就业服务"采购支持。
                我们不靠用户赚钱，而是帮政府解决"稳就业"KPI。
              </p>
              <p className="text-base leading-loose text-foreground/80 mb-12">
                我们的目标：让八千万三十五岁以上失业者，
                在四个月内重新就业。这是公共事业，不是商业 SaaS。
              </p>
              <Link href="/about">
                <Button variant="editorial">了解我们的理念</Button>
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
              © 2026 — 再出发 Reinvention Suite
            </div>
            <div className="flex gap-12 meta-label">
              <Link href="/gov-dashboard" className="hover:opacity-50 transition-opacity duration-600">
                政府看板
              </Link>
              <Link href="/about" className="hover:opacity-50 transition-opacity duration-600">
                关于
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
      <div className="col-span-2 meta-label pt-1 text-accent">{num}</div>
      <div className="col-span-10 flex flex-col gap-3">
        <h3 className="editorial-title text-2xl font-light">{title}</h3>
        <p className="text-sm text-muted-foreground leading-loose">{desc}</p>
      </div>
    </div>
  );
}
