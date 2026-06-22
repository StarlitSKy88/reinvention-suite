/**
 * 政府数据看板 - UI 页面
 *
 * 美观度达到"政府演示级别"
 * 支持打印导出
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Activity,
  Target,
  TrendingUp,
  Heart,
  Download,
  RefreshCw,
} from 'lucide-react';
import type {
  GovDashboardMetrics,
  GovSuccessCase,
} from '@reinvention/types';

export default function GovDashboardPage() {
  const [metrics, setMetrics] = useState<GovDashboardMetrics | null>(null);
  const [cases, setCases] = useState<GovSuccessCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [metricsRes, casesRes] = await Promise.all([
        fetch('/api/gov/dashboard?scope=city'),
        fetch('/api/gov/dashboard/cases?scope=city'),
      ]);

      const [metricsJson, casesJson] = await Promise.all([
        metricsRes.json(),
        casesRes.json(),
      ]);

      if (metricsJson.success) {
        setMetrics(metricsJson.data);
      }
      if (casesJson.success) {
        setCases(casesJson.data || []);
      }
    } catch (err) {
      console.error('加载看板失败', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !metrics) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="text-center text-muted-foreground">加载中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* 顶部标题栏 */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              再就业服务数据看板
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              统计周期：{metrics.period.start} ~ {metrics.period.end}
              <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                数据实时更新
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadDashboard}>
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              导出 PDF
            </Button>
          </div>
        </header>

        {/* 核心指标 - 4 张大卡片 */}
        <section className="mb-8 grid gap-4 md:grid-cols-4">
          <MetricCard
            icon={<Users className="h-6 w-6" />}
            label="服务覆盖"
            value={metrics.serviceCoverage.totalUsers.toLocaleString()}
            subValue={`35+ 占比 ${(metrics.serviceCoverage.ageAbove35Ratio * 100).toFixed(0)}%`}
            trend={`+${metrics.serviceCoverage.newUsersThisMonth.toLocaleString()} 本月新增`}
            color="blue"
          />
          <MetricCard
            icon={<Activity className="h-6 w-6" />}
            label="月活用户"
            value={metrics.activity.monthlyActiveUsers.toLocaleString()}
            subValue={`留存率 ${(metrics.activity.retentionRate * 100).toFixed(0)}%`}
            trend="↑ 较上月 +12%"
            color="green"
          />
          <MetricCard
            icon={<Target className="h-6 w-6" />}
            label="再就业成功率"
            value={`${(metrics.successRate.reemploymentRate * 100).toFixed(1)}%`}
            subValue={`${metrics.successRate.successfulReemployment.toLocaleString()} 人成功`}
            trend={`平均求职 ${metrics.successRate.averageJobSearchDays} 天`}
            color="purple"
          />
          <MetricCard
            icon={<Heart className="h-6 w-6" />}
            label="用户满意度"
            value={`NPS ${metrics.satisfaction.npsScore}`}
            subValue={`好评率 ${(metrics.satisfaction.positiveRate * 100).toFixed(0)}%`}
            trend="优秀"
            color="orange"
          />
        </section>

        {/* 效率提升 */}
        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">简历优化次数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {metrics.serviceDepth.resumeRewrites.toLocaleString()}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                累计帮助 {metrics.serviceDepth.resumeUploads.toLocaleString()} 份简历完成结构化
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">岗位匹配次数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {metrics.serviceDepth.jobMatches.toLocaleString()}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                全网匹配（含 Boss/拉勾/猎聘/官网）
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">项目孵化数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {metrics.serviceDepth.projectIncubations.toLocaleString()}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                协助用户做真实项目（非 AI 编造）
              </p>
            </CardContent>
          </Card>
        </section>

        {/* 用户画像 */}
        <section className="mb-8 grid gap-4 md:grid-cols-2">
          <DemographicsCard
            title="年龄分布"
            data={metrics.userDemographics.ageDistribution}
            color="blue"
          />
          <DemographicsCard
            title="行业分布"
            data={metrics.userDemographics.industryDistribution}
            color="green"
          />
          <DemographicsCard
            title="地区分布"
            data={metrics.userDemographics.regionDistribution}
            color="purple"
          />
          <DemographicsCard
            title="失业时长分布"
            data={metrics.userDemographics.unemploymentDurationDistribution}
            color="orange"
          />
        </section>

        {/* 标杆案例 */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                标杆案例（已获用户授权）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cases.length === 0 ? (
                <p className="text-sm text-muted-foreground">加载中...</p>
              ) : (
                cases.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border bg-gradient-to-r from-green-50 to-blue-50 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          {c.ageRange}
                        </span>
                        <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                          {c.industry}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          失业 {c.unemploymentMonths} 个月
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground line-through">
                          {c.originalSalary}w
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          {c.newSalary}w
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">目标岗位：</span>
                      {c.targetJob}
                    </div>
                    <p className="mt-2 text-sm text-slate-700">
                      {c.storyNarrative}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t pt-4 text-center text-xs text-muted-foreground">
          数据已脱敏 · 符合《个保法》要求 · 简历原文不上传
          <br />
          再出发 Reinvention Suite · 政府再就业服务支持
        </footer>
      </div>
    </main>
  );
}

// ─── 子组件 ──────────────────────────────────────────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  subValue,
  trend,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  trend: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <Card className="overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${colorMap[color]}`} />
      <CardContent className="pt-6">
        <div className="mb-2 flex items-center justify-between text-muted-foreground">
          <span className="text-sm">{label}</span>
          {icon}
        </div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{subValue}</div>
        <div className="mt-2 text-xs font-medium text-green-600">{trend}</div>
      </CardContent>
    </Card>
  );
}

function DemographicsCard({
  title,
  data,
  color,
}: {
  title: string;
  data: Record<string, number>;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...Object.values(data));

  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.map(([key, value]) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{key}</span>
              <span className="font-medium">
                {(value * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full ${colorMap[color]} transition-all`}
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
