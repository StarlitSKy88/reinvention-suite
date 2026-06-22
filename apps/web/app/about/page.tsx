/**
 * 关于我们页面
 *
 * 包含：产品故事、To-G 模式说明、隐私承诺、联系方式
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Shield, Users, Target, Heart } from 'lucide-react';

export const metadata = {
  title: '关于再出发 - Reinvention Suite',
  description: '了解再出发如何帮助 35+ 失业群体免费再就业',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* 返回按钮 */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Link>

        {/* Hero */}
        <section className="mb-12 text-center">
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight md:text-5xl">
            关于再出发
          </h1>
          <p className="text-balance text-xl text-muted-foreground">
            我们相信 35+ 不是终点，而是重新出发的起点。
          </p>
        </section>

        {/* 我们的故事 */}
        <section className="mb-12 space-y-6">
          <h2 className="text-2xl font-bold">我们的故事</h2>
          <p className="leading-relaxed text-muted-foreground">
            2026 年，中国 35-50 岁失业人口达 8000 万。这些人有着丰富的经验、成熟的判断力、稳定的人脉，
            却因为年龄歧视、简历被秒筛、不知道差什么等原因，反复求职失败。
          </p>
          <p className="leading-relaxed text-muted-foreground">
            再出发是一款由各地人社局"再就业服务"采购支持的免费工具。我们不靠用户赚钱，
            而是帮政府解决"稳就业"KPI。35+ 失业群体可以完全免费使用我们的全部功能。
          </p>
        </section>

        {/* 核心价值 */}
        <section className="mb-12 grid gap-6 md:grid-cols-2">
          <ValueCard
            icon={<Users className="h-6 w-6" />}
            title="全网匹配企业"
            description="不只 Boss 直聘，搜遍公司官网、行业社群、猎头渠道，找到真正匹配你的岗位"
          />
          <ValueCard
            icon={<Target className="h-6 w-6" />}
            title="主动协助弥补差距"
            description="差距分析报告告诉你差什么，10+ 真实项目模板协助你做出能写进简历的项目"
          />
          <ValueCard
            icon={<Heart className="h-6 w-6" />}
            title="简历真实人设工程"
            description="AI 只翻译不编造。反幻觉三重保险，保留你的真实业绩，不做'AI 简历'"
          />
          <ValueCard
            icon={<Shield className="h-6 w-6" />}
            title="隐私保护优先"
            description="简历原文只在你的浏览器，PII 自动脱敏，符合《个保法》要求"
          />
        </section>

        {/* 我们的承诺 */}
        <section className="mb-12">
          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold">我们对 35+ 的承诺</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li>✓ 完全免费，无隐藏收费</li>
                <li>✓ 无自动续费陷阱（行业普遍问题，我们不做）</li>
                <li>✓ AI 改写不编造数字、项目、技能</li>
                <li>✓ 简历原文不上传服务器</li>
                <li>✓ 一键删除所有数据</li>
                <li>✓ 不向第三方出售用户数据</li>
                <li>✓ 不打骚扰电话（行业普遍问题，我们不做）</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* 政府合作 */}
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">To-G 合作模式</h2>
          <p className="leading-relaxed text-muted-foreground">
            再出发由各地人社局"再就业服务"采购支持。如果您是政府就业服务部门，
            希望在您的辖区试点，请联系：gov@reinvention.example
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            我们已经为街道办、区县、城市三级政府提供再就业服务数据看板，
            包括覆盖率、活跃度、成功率、NPS 等核心指标。
          </p>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Button size="lg" asChild>
            <Link href="/">开始使用</Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            完全免费 · 无需信用卡 · 隐私保护
          </p>
        </section>
      </div>
    </main>
  );
}

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-2 text-primary">{icon}</div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
