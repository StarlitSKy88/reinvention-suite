/**
 * Analytics 上报 API
 *
 * 接收客户端埋点数据，存储到数据库，供政府看板使用。
 * 完全脱敏（不存真实 userId，仅存 hash）。
 */

import { NextResponse } from 'next/server';

interface AnalyticsEvent {
  type: string;
  timestamp: string;
  anonymousUserId: string;
  properties: Record<string, unknown>;
  source?: string;
}

interface AnalyticsBatch {
  events: AnalyticsEvent[];
  context: {
    govProgramId?: string;
    city?: string;
  };
}

export async function POST(request: Request) {
  try {
    const batch = (await request.json()) as AnalyticsBatch;

    // TODO: 存储到 PostgreSQL（Task #23 政府看板用）
    // 这里仅简单记录日志

    console.log('[Analytics]', {
      eventCount: batch.events.length,
      govProgramId: batch.context.govProgramId,
      city: batch.context.city,
      types: batch.events.map((e) => e.type),
    });

    return NextResponse.json({ success: true, count: batch.events.length });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid analytics data' },
      { status: 400 }
    );
  }
}
