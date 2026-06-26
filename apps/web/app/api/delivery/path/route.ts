/**
 * 投递路径搜索 API
 *
 * GET /api/delivery/path?company=xxx
 *
 * 返回：官网投递入口（最佳）或候选渠道清单（兜底）
 */

import { NextResponse } from 'next/server';
import { findDeliveryPath } from '@/lib/delivery/path-finder';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyName = searchParams.get('company');

    if (!companyName) {
      return NextResponse.json(
        { success: false, error: 'company parameter required' },
        { status: 400 }
      );
    }

    const result = await findDeliveryPath({
      companyName,
      useLLM: true,
    });

    return NextResponse.json({
      success: true,
      data: result.primary,
      searchDurationMs: result.searchDurationMs,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to search delivery path' },
      { status: 500 }
    );
  }
}
