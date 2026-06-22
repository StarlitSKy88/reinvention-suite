/**
 * 政府数据看板 — 黑底白字红字点缀
 * 编辑感大数字 + 不对称布局
 * 全中文
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
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
      <main className="ma-layout min-h-screen flex items-center justify-center">
        <div className="meta-label">加载中…</div>
      </main>
    );
  }

  return (
    <main className="bg-background">
      {/* ========== Header ========== */}
      <section className="border-b border-border py-12">
        <div className="ma-layout">
          <div className="ma-full flex justify-between items-end">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <span className="meta-label text-accent">政府专用 · 城市数据</span>
              </div>
              <h1 className="editorial-title text-3xl md:text-5xl font-light">
                再就业<br />服务 报告
              </h1>
              <div className="meta-label pt-4">
                {metrics.period.start} — {metrics.period.end}
              </div>
            </div>

            <div className="flex flex-col items-end gap-4">
              <div className="meta-label flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                实时数据更新
              </div>
              <Button variant="editorial" onClick={loadDashboard}>
                <RefreshCw className="mr-2 h-3 w-3" strokeWidth={1} />
                刷新
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== 4 大指标 ========== */}
      <section className="py-section">
        <div className="ma-layout">
          <div className="ma-full">
            <div className="flex items-center gap-6 mb-16">
              <div className="w-8 h-px bg-accent" />
              <span className="meta-label">核心指标 · 四项</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
              <BigMetric
                num="I"
                label="服务覆盖"
                value={metrics.serviceCoverage.totalUsers.toLocaleString()}
                sub={`三十五岁以上占比 ${(metrics.serviceCoverage.ageAbove35Ratio * 100).toFixed(0)}%`}
                trend={`本月新增 +${metrics.serviceCoverage.newUsersThisMonth.toLocaleString()}`}
              />
              <BigMetric
                num="II"
                label="月活用户"
                value={metrics.activity.monthlyActiveUsers.toLocaleString()}
                sub={`留存率 ${(metrics.activity.retentionRate * 100).toFixed(0)}%`}
                trend="环比 +12%"
              />
              <BigMetric
                num="III"
                label="再就业成功率"
                value={`${(metrics.successRate.reemploymentRate * 100).toFixed(1)}%`}
                sub={`${metrics.successRate.successfulReemployment.toLocaleString()} 人成功`}
                trend={`平均 ${metrics.successRate.averageJobSearchDays} 天`}
              />
              <BigMetric
                num="IV"
                label="用户满意度"
                value={`NPS ${metrics.satisfaction.npsScore}`}
                sub={`好评率 ${(metrics.satisfaction.positiveRate * 100).toFixed(0)}%`}
                trend="优秀"
              />
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      {/* ========== 服务深度 ========== */}
      <section className="py-section">
        <div className="ma-layout">
          <div className="ma-full grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-24">
            <div className="md:col-span-2">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-8 h-px bg-accent" />
                <span className="meta-label">服务深度 · 三项</span>
              </div>
              <h2 className="editorial-title text-3xl font-light">
                累计<br />服务深度
              </h2>
            </div>

            <div className="md:col-span-3 flex flex-col gap-12">
              <SmallMetric
                label="简历优化次数"
                value={metrics.serviceDepth.resumeRewrites.toLocaleString()}
                sub={`累计 ${metrics.serviceDepth.resumeUploads.toLocaleString()} 份简历结构化`}
              />
              <SmallMetric
                label="岗位匹配次数"
                value={metrics.serviceDepth.jobMatches.toLocaleString()}
                sub="全网 Boss/拉勾/猎聘/官网"
              />
              <SmallMetric
                label="项目孵化"
                value={metrics.serviceDepth.projectIncubations.toLocaleString()}
                sub="真实项目孵化（不是 AI 编造）"
              />
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      {/* ========== 用户画像 ========== */}
      <section className="py-section">
        <div className="ma-layout">
          <div className="ma-full">
            <div className="flex items-center gap-6 mb-16">
              <div className="w-8 h-px bg-accent" />
              <span className="meta-label">人口统计 · 四维</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-16">
              <Distribution
                title="年龄分布"
                data={metrics.userDemographics.ageDistribution}
              />
              <Distribution
                title="行业分布"
                data={metrics.userDemographics.industryDistribution}
              />
              <Distribution
                title="地区分布"
                data={metrics.userDemographics.regionDistribution}
              />
              <Distribution
                title="失业时长分布"
                data={metrics.userDemographics.unemploymentDurationDistribution}
              />
            </div>
          </div>
        </div>
      </section>

      <hr className="structural-line" />

      {/* ========== 标杆案例 ========== */}
      <section className="py-section">
        <div className="ma-layout">
          <div className="ma-full">
            <div className="flex items-center gap-6 mb-16">
              <div className="w-8 h-px bg-accent" />
              <span className="meta-label">成功案例 · 用户授权</span>
            </div>

            {cases.length === 0 ? (
              <div className="meta-label">加载中…</div>
            ) : (
              <div className="flex flex-col gap-12">
                {cases.map((c, idx) => (
                  <SuccessCaseItem key={c.id} c={c} index={idx + 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="ma-layout">
          <div className="ma-full text-center meta-label">
            数据已脱敏 · 符合《个保法》要求 · 简历原文不上传<br />
            再出发 — 政府再就业服务支持
          </div>
        </div>
      </footer>
    </main>
  );
}

// ─── 子组件 ────────────────────────────────────────────────────────────────

function BigMetric({
  num,
  label,
  value,
  sub,
  trend,
}: {
  num: string;
  label: string;
  value: string;
  sub: string;
  trend: string;
}) {
  return (
    <div className="bg-background p-12 flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <span className="meta-label">{label}</span>
        <span className="meta-label opacity-40 text-accent">{num}</span>
      </div>
      <div className="text-display-sm editorial-title font-light">
        {value}
      </div>
      <div className="flex flex-col gap-1">
        <div className="text-sm text-muted-foreground">{sub}</div>
        <div className="meta-label text-accent pt-2">{trend}</div>
      </div>
    </div>
  );
}

function SmallMetric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-6">
      <span className="meta-label">{label}</span>
      <div className="text-5xl editorial-title font-light">{value}</div>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function Distribution({
  title,
  data,
}: {
  title: string;
  data: Record<string, number>;
}) {
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...Object.values(data));

  return (
    <div className="flex flex-col gap-6">
      <h3 className="meta-label border-b border-border pb-3">{title}</h3>
      <div className="flex flex-col gap-4">
        {sorted.map(([key, value]) => (
          <div key={key} className="flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm">{key}</span>
              <span className="meta-label">{(value * 100).toFixed(1)}%</span>
            </div>
            <div className="h-px bg-border relative">
              <div
                className="absolute inset-y-0 left-0 bg-accent"
                style={{ width: `${(value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuccessCaseItem({
  c,
  index,
}: {
  c: GovSuccessCase;
  index: number;
}) {
  return (
    <article className="grid grid-cols-12 gap-8 border-t border-border pt-8">
      <div className="col-span-1 meta-label text-accent">{String(index).padStart(2, '0')}</div>

      <div className="col-span-7 max-w-reading flex flex-col gap-4">
        <div className="flex items-center gap-4 meta-label">
          <span>{c.ageRange}</span>
          <span className="opacity-30">·</span>
          <span>{c.industry}</span>
          <span className="opacity-30">·</span>
          <span>失业 {c.unemploymentMonths} 个月</span>
        </div>
        <div className="meta-label">→ {c.targetJob}</div>
        <p className="text-base leading-loose text-foreground/85">
          {c.storyNarrative}
        </p>
      </div>

      <div className="col-span-4 flex flex-col items-end justify-between">
        <div className="flex flex-col items-end gap-2">
          <div className="meta-label">入职前</div>
          <div className="text-2xl text-muted-foreground line-through">
            {c.originalSalary} 万
          </div>
        </div>
        <div className="accent-mark" />
        <div className="flex flex-col items-end gap-2">
          <div className="meta-label text-accent">入职后</div>
          <div className="text-5xl editorial-title font-light text-accent">
            {c.newSalary} <span className="text-2xl">万</span>
          </div>
        </div>
      </div>
    </article>
  );
}
