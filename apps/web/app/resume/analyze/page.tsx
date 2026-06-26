/**
 * 简历分析报告页（完整版）
 *
 * 显示：
 * 1. 简历基本信息（已脱敏）
 * 2. 年龄去敏检测结果
 * 3. 反歧视检测结果
 * 4. 反幻觉改写后的简历
 * 5. 下一步：匹配岗位 / 推荐项目
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AnalysisResult {
  id: string;
  fileName: string;
  createdAt: string;
  structured: {
    name: string;
    contact: any;
    experiences: any[];
    education: any[];
    skills: string[];
    projects: any[];
  };
  ageMask: {
    detections: Array<{
      original: string;
      riskLevel: string;
      category: string;
      rewritten: string;
      reasoning: string;
    }>;
    overallRiskScore: number;
  };
  discrim: {
    detections: Array<{
      original: string;
      biasType: string;
      riskLevel: string;
      rewritten: string;
      hrPsychology: string;
    }>;
    overallRiskScore: number;
  };
  rewrite: string;
  meta: {
    totalDurationMs: number;
    warnings: string[];
  };
}

export default function ResumeAnalyzePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResumeAnalyzeContent />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <main className="ma-layout min-h-screen flex items-center justify-center">
      <div className="meta-label">加载中…</div>
    </main>
  );
}

// 服务器端组件：读取分析 ID，传递到客户端
import { ResumeAnalyzeClient } from './client';

async function loadAnalysis(id: string): Promise<AnalysisResult | null> {
  // 在服务器端不能直接读 IndexedDB，使用客户端组件
  return null;
}

function ResumeAnalyzeContent() {
  return <ResumeAnalyzeClient />;
}
