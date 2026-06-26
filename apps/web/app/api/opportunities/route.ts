/**
 * To-G 项目机会发现 API
 *
 * GET /api/opportunities - 获取评分后的 To-G 机会列表
 * POST /api/opportunities/refresh - 手动触发重新爬取
 */

import { NextResponse } from 'next/server';
import {
  GovProcurementScraper,
  HRSSBulletinScraper,
  scorer,
} from '@/lib/scraper-client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 缓存：避免每次都爬
let cache: {
  data: any[];
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 分钟

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get('refresh') === 'true';
  const minScore = parseInt(searchParams.get('minScore') || '0');
  const region = searchParams.get('region') || undefined;

  // 检查缓存
  if (!refresh && cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      success: true,
      data: filterOpportunities(cache.data, minScore, region),
      cached: true,
      cachedAt: new Date(cache.timestamp).toISOString(),
    });
  }

  // 重新爬取
  try {
    const opportunities = await crawlAndScore();

    cache = {
      data: opportunities,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      success: true,
      data: filterOpportunities(opportunities, minScore, region),
      cached: false,
      total: opportunities.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch opportunities',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * 爬取并评分
 */
async function crawlAndScore(): Promise<any[]> {
  const govScraper = new GovProcurementScraper();
  const hrssScraper = new HRSSBulletinScraper();

  // 并发爬取
  const [govResults, hrssResults] = await Promise.all([
    govScraper.scrapeAllKeywords().catch(() => []),
    hrssScraper.scrape().catch(() => []),
  ]);

  const all = [...govResults, ...hrssResults];

  // 评分
  const scored = all.map((opp) => ({
    ...opp.toDict ? opp.toDict() : opp,
    scoring: scorer.score(opp),
  }));

  // 按评分排序
  scored.sort((a, b) => b.scoring.score - a.scoring.score);

  return scored;
}

/**
 * 过滤机会
 */
function filterOpportunities(
  data: any[],
  minScore: number,
  region?: string
): any[] {
  return data.filter((opp) => {
    if (opp.scoring.score < minScore) return false;
    if (region && !opp.location?.includes(region)) return false;
    return true;
  });
}

/**
 * 手动触发刷新
 */
export async function POST(request: Request) {
  cache = null;
  return NextResponse.json({
    success: true,
    message: 'Cache cleared, next GET will refresh',
  });
}
