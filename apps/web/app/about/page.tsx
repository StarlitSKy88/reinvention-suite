import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * 关于我们 — 黑底白字红字点缀
 * 编辑感叙事 + 中文
 */

export const metadata = {
  title: '关于 — 再出发',
};

export default function AboutPage() {
  return (
    <main className="bg-background">
      <section className="relative min-h-[60vh] flex items-center py-section">
        <span
          aria-hidden
          className="absolute top-12 right-8 text-[20vw] font-light text-accent/[0.06] leading-none select-none pointer-events-none"
        >
          01
        </span>

        <div className="ma-layout w-full">
          <div className="ma-bleed-right">
            <div className="flex flex-col gap-12 max-w-prose">
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <span className="meta-label text-accent">关于</span>
              </div>

              <h1 className="editorial-title text-display-sm">
                三十五岁以上<br />
                不是终点<br />
                而是<span className="text-accent">重新出发</span>的起点
              </h1>
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      <section className="py-section">
        <div className="ma-layout">
          <div className="ma-full grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-24">
            <div className="md:col-span-2">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-8 h-px bg-accent" />
                <span className="meta-label">我们的故事</span>
              </div>
              <h2 className="editorial-title text-3xl font-light">为什么做这件事</h2>
            </div>

            <div className="md:col-span-3 flex flex-col gap-8 max-w-reading">
              <p className="leading-loose text-foreground/85">
                2026 年，中国三十五到五十岁失业人口达八千万。
                这些人有丰富的经验、成熟的判断力、稳定的人脉，
                却因为年龄歧视、简历被秒筛、不知道差什么等原因，
                反复求职失败。
              </p>
              <p className="leading-loose text-foreground/85">
                再出发是一款由各地人社局"再就业服务"采购支持的免费工具。
                我们不靠用户赚钱，而是帮政府解决"稳就业"KPI。
                三十五岁以上失业者，可以完全免费使用我们的全部功能。
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      <section className="py-section">
        <div className="ma-layout">
          <div className="ma-bleed-left">
            <div className="ml-[12vw] pl-6 border-l-2 border-accent max-w-prose">
              <div className="meta-label mb-8 text-accent">七条承诺</div>
              <h2 className="editorial-title text-3xl font-light mb-12">
                我们对三十五岁以上的<br />承诺
              </h2>

              <div className="flex flex-col gap-6 text-sm">
                <Promise>I. 完全免费，无隐藏收费</Promise>
                <Promise>II. 无自动续费陷阱（行业普遍问题，我们不做）</Promise>
                <Promise>III. AI 改写不编造数字、项目、技能</Promise>
                <Promise>IV. 简历原文不上传服务器</Promise>
                <Promise>V. 一键删除所有数据</Promise>
                <Promise>VI. 不向第三方出售用户数据</Promise>
                <Promise>VII. 不打骚扰电话（行业普遍问题，我们不做）</Promise>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      <section className="py-section">
        <div className="ma-layout">
          <div className="ma-full grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-24">
            <div className="md:col-span-2">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-8 h-px bg-accent" />
                <span className="meta-label">To-G 合作</span>
              </div>
              <h2 className="editorial-title text-3xl font-light">
                面向政府的<br />合作模式
              </h2>
            </div>

            <div className="md:col-span-3 flex flex-col gap-8 max-w-reading">
              <p className="leading-loose text-foreground/85">
                再出发由各地人社局"再就业服务"采购支持。
                如果您是政府就业服务部门，希望在您的辖区试点，
                请联系：gov@reinvention.example
              </p>
              <p className="leading-loose text-foreground/85">
                我们已为街道办、区县、城市三级政府提供再就业服务数据看板，
                包括覆盖率、活跃度、再就业成功率、NPS 等核心指标，
                数据已脱敏，符合《个保法》要求。
              </p>
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      <section className="py-section text-center">
        <div className="ma-layout">
          <div className="ma-full flex flex-col items-center gap-12">
            <h2 className="editorial-title text-display-sm">开始使用</h2>
            <Link href="/">
              <Button variant="accent">免费开始</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-16">
        <div className="ma-layout">
          <div className="ma-full flex justify-between items-center">
            <div className="meta-label">© 2026 — 再出发</div>
            <Link href="/" className="meta-label hover:opacity-50 transition-opacity duration-600">
              首页
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
      <div className="meta-label pt-0.5 shrink-0 text-accent">✓</div>
      <div className="leading-relaxed text-foreground/85">{children}</div>
    </div>
  );
}
