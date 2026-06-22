import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Sparkles, Target, Heart, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            <span>35+ 失业群体再就业免费助手</span>
          </div>

          <h1 className="mb-6 text-balance text-5xl font-bold tracking-tight md:text-7xl">
            让 <span className="text-primary">35+</span> 不必再假装 25
          </h1>

          <p className="mb-10 text-balance text-xl text-muted-foreground md:text-2xl">
            再出发 — 全网匹配企业，主动协助弥补能力差距，
            <br />
            让再就业周期从 8 个月缩短到 4 个月。
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="#features">
                免费开始
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about">了解更多</Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            完全免费 · 隐私保护 · 简历原文不上传
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
            我们做什么
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Target className="h-8 w-8 text-primary" />
                <CardTitle className="mt-4">全网匹配</CardTitle>
                <CardDescription>
                  不只 Boss 直聘，搜遍公司官网、行业社群、猎头渠道，找到真正匹配你的岗位
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="h-8 w-8 text-primary" />
                <CardTitle className="mt-4">简历优化</CardTitle>
                <CardDescription>
                  AI 反幻觉改写 + 年龄去敏 + 反歧视触发器检测，保留你的真实业绩
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-8 w-8 text-primary" />
                <CardTitle className="mt-4">真实项目孵化</CardTitle>
                <CardDescription>
                  协助你做出真实项目（开源、写作、MVP），不是 AI 编造，而是你真的做到了
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-primary" />
                <CardTitle className="mt-4">隐私保护</CardTitle>
                <CardDescription>
                  简历原文只在你的浏览器，PII 自动脱敏，符合《个保法》要求
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-8">
              <h3 className="mb-4 text-2xl font-bold">为什么免费？</h3>
              <p className="text-muted-foreground">
                再出发由各地人社局"再就业服务"采购支持，
                完全免费提供给 35+ 失业群体使用。
                我们不靠用户赚钱，而是帮政府解决"稳就业"KPI。
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                您的数据完全由您掌控，我们仅采集必要的服务数据用于效果评估。
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
