/**
 * GET /api/health
 * 零依赖健康检查
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    runtime: 'edgeone-pages',
    version: '0.1.0',
  });
}
