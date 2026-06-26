import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { analyzeJD } from '@/lib/match/jd-analyzer';

export async function GET() {
  try {
    const dbJobs = await prisma.jobPosting.findMany({ take: 1 });
    if (dbJobs.length === 0) return NextResponse.json({ error: 'no jobs' });
    
    const jdAnalysis = await analyzeJD(dbJobs[0].description);
    return NextResponse.json({ 
      success: true, 
      jdAnalysis 
    });
  } catch (err) {
    return NextResponse.json({ 
      success: false,
      error: (err as Error).message,
      stack: (err as Error).stack?.slice(0, 500),
    });
  }
}
