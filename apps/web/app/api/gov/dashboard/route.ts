/**
 * 政府数据看板 API
 *
 * GET /api/gov/dashboard?scope=city&regionCode=beijing
 * GET /api/gov/dashboard/cases?scope=city
 */

import { NextResponse } from 'next/server';
import {
  aggregateDashboardMetrics,
  getSuccessCases,
} from '@/lib/gov/dashboard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope =
      (searchParams.get('scope') as
        | 'street'
        | 'district'
        | 'city'
        | 'province'
        | 'national') || 'national';
    const regionCode = searchParams.get('regionCode') || undefined;
    const govProgramId = searchParams.get('govProgramId') || undefined;

    // TODO: 鉴权（验证请求来自合法政府用户）

    const metrics = await aggregateDashboardMetrics({
      scope,
      regionCode,
      govProgramId,
    });

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}
