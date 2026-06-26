/**
 * 岗位列表 API
 *
 * GET /api/jobs/list
 * 从 PostgreSQL 真实读取所有岗位
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const jobs = await prisma.jobPosting.findMany({
      orderBy: { postedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      total: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error('查询岗位失败:', error);
    return NextResponse.json(
      { success: false, error: '查询岗位失败' },
      { status: 500 }
    );
  }
}
