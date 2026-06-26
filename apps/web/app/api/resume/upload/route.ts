/**
 * 简历上传 + 解析 + 改写 API（服务端处理版本）
 *
 * 注意：MVP 阶段主要用客户端处理（/resume/upload）
 * 这个 API 用于：
 * - 服务端备份（如用户开了云同步）
 * - 服务端调用 LLM 改写（重写任务）
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

const UploadRequestSchema = z.object({
  resumeId: z.string(),
  rewriteType: z.enum(['general', 'for_jd', 'age_masked', 'discrim_safe']).default('general'),
  targetJobId: z.string().optional(),
  highQuality: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = UploadRequestSchema.parse(body);

    // TODO: 从 IndexedDB 同步的简历（在服务端处理）
    // const resume = await prisma.resume.findUnique(...);
    // const { rewriteResume } = await import('@/lib/ai/rewriter');
    // const result = await rewriteResume({...});

    return NextResponse.json({
      success: true,
      message: '服务端处理预留接口，MVP 阶段在客户端处理',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
