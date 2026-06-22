/**
 * 政府数据看板 - 标杆案例 API
 *
 * GET /api/gov/dashboard/cases?scope=city
 */

import { NextResponse } from 'next/server';
import { getSuccessCases } from '@/lib/gov/dashboard';

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

    const cases = await getSuccessCases({
      scope,
      regionCode,
      govProgramId,
    });

    return NextResponse.json({
      success: true,
      data: cases,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load success cases' },
      { status: 500 }
    );
  }
}
