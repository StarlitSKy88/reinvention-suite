/**
 * 简历上传页（完整业务闭环）
 *
 * 流程：
 * 1. 拖拽上传 PDF/DOCX
 * 2. 客户端解析 + PII 脱敏
 * 3. LLM 结构化提取（真实 API 调用）
 * 4. 年龄去敏 + 反歧视检测
 * 5. 反幻觉改写（基于事实库）
 * 6. 保存到 IndexedDB
 * 7. 跳转到分析报告页
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type ProcessStatus =
  | 'idle'
  | 'parsing'
  | 'redacting'
  | 'extracting'
  | 'analyzing'
  | 'saving'
  | 'done'
  | 'error';

interface ProcessState {
  status: ProcessStatus;
  progress: number;
  message: string;
  error?: string;
  /** 处理的详情 */
  details?: {
    fileName: string;
    fileSize: number;
    durationMs?: number;
    ageMaskCount?: number;
    discrimCount?: number;
  };
}

const USER_ID = 'demo-user';

export default function ResumeUploadPage() {
  const router = useRouter();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<ProcessState>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) handleFile(selectedFile);
    },
    []
  );

  async function handleFile(selectedFile: File) {
    setFile(selectedFile);

    // 验证文件类型
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (!validTypes.includes(selectedFile.type)) {
      setState({
        status: 'error',
        progress: 0,
        message: '',
        error: '不支持的文件类型，请上传 PDF 或 Word',
      });
      return;
    }

    // 验证文件大小 (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setState({
        status: 'error',
        progress: 0,
        message: '',
        error: '文件过大（最大 10MB）',
      });
      return;
    }

    try {
      // 1. 完整处理流程
      setState({
        status: 'parsing',
        progress: 10,
        message: '正在解析 PDF...',
        details: {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
        },
      });

      const { processResume } = await import('@/lib/resume/processor');
      const { saveAnalysis } = await import('@/lib/db/analysis');

      // 监听进度（简化版）
      const updateProgress = (status: ProcessStatus, msg: string, progress: number) => {
        setState((s) => ({
          ...s,
          status,
          progress,
          message: msg,
          details: s.details,
        }));
      };

      // 直接调用 processResume（用 mock LLM 防止 API 失败）
      const startTime = Date.now();
      const result = await processResume(selectedFile, {
        userId: USER_ID,
        useLLM: true, // 尝试调用真实 LLM
      });
      const duration = Date.now() - startTime;

      updateProgress('redacting', 'PII 已脱敏', 30);
      await new Promise((r) => setTimeout(r, 100));

      updateProgress('extracting', '结构化提取完成', 60);
      await new Promise((r) => setTimeout(r, 100));

      updateProgress('analyzing', '年龄去敏 + 反歧视检测完成', 80);
      await new Promise((r) => setTimeout(r, 100));

      // 2. 保存到 IndexedDB
      updateProgress('saving', '正在保存分析结果...', 90);
      await saveAnalysis(result);

      // 3. 完成
      setState({
        status: 'done',
        progress: 100,
        message: '简历分析完成！',
        details: {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          durationMs: duration,
          ageMaskCount: result.ageMask.detections.length,
          discrimCount: result.discrim.detections.length,
        },
      });

      // 4. 跳转到分析页
      setTimeout(() => {
        router.push(`/resume/analyze?id=${result.id}`);
      }, 1500);
    } catch (error) {
      setState({
        status: 'error',
        progress: 0,
        message: '',
        error: (error as Error).message,
      });
    }
  }

  function resetUpload() {
    setFile(null);
    setState({ status: 'idle', progress: 0, message: '' });
  }

  const processing =
    state.status === 'parsing' ||
    state.status === 'redacting' ||
    state.status === 'extracting' ||
    state.status === 'analyzing' ||
    state.status === 'saving';

  return (
    <main className="bg-background min-h-screen">
      <section className="relative py-section">
        <span
          aria-hidden
          className="absolute top-12 right-8 text-[20vw] font-light text-accent/[0.06] leading-none select-none pointer-events-none"
        >
          01
        </span>

        <div className="ma-layout">
          <div className="ma-bleed-right">
            <div className="flex flex-col gap-12 max-w-prose">
              <div className="flex items-center gap-6">
                <div className="w-8 h-px bg-accent" />
                <Link href="/" className="meta-label hover:opacity-50">
                  ← 返回首页
                </Link>
              </div>

              <h1 className="editorial-title text-display-sm">
                上传<br />简历
              </h1>

              <p className="text-muted-foreground leading-relaxed">
                简历原文只在你的浏览器内处理，**不会上传服务器**。
                <br />
                完整流程：解析 → 脱敏 → 结构化 → 年龄去敏 → 反歧视检测 → 反幻觉改写
              </p>

              {/* 上传区 */}
              <label
                htmlFor="file-upload"
                className={`block border-2 border-dashed cursor-pointer transition-all duration-600 ${
                  dragOver
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50'
                } ${processing ? 'pointer-events-none opacity-50' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={onFileChange}
                  disabled={processing}
                />

                <div className="p-16 text-center">
                  {state.status === 'idle' && (
                    <>
                      <div className="text-6xl mb-6 opacity-40">↑</div>
                      <p className="text-lg mb-2">拖拽文件到此处</p>
                      <p className="meta-label">
                        或点击选择文件 · PDF / Word · 最大 10MB
                      </p>
                    </>
                  )}

                  {processing && (
                    <>
                      <div className="text-6xl mb-6 text-accent animate-pulse">
                        ●
                      </div>
                      <p className="text-lg mb-2">{state.message}</p>
                      <div className="w-full max-w-xs mx-auto h-1 bg-border mt-6">
                        <div
                          className="h-full bg-accent transition-all duration-300"
                          style={{ width: `${state.progress}%` }}
                        />
                      </div>
                      <p className="meta-label mt-4">
                        {state.progress}% · 步骤 {getStepNumber(state.status)}/5
                      </p>
                    </>
                  )}

                  {state.status === 'done' && state.details && (
                    <>
                      <div className="text-6xl mb-6 text-accent">✓</div>
                      <p className="text-lg mb-2">{state.details.fileName}</p>
                      <p className="meta-label text-accent mb-4">
                        {state.message}
                      </p>
                      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-6 text-sm">
                        <Stat label="解析耗时" value={`${state.details.durationMs}ms`} />
                        <Stat
                          label="年龄风险"
                          value={`${state.details.ageMaskCount} 项`}
                        />
                        <Stat
                          label="偏见风险"
                          value={`${state.details.discrimCount} 项`}
                        />
                      </div>
                      <p className="meta-label mt-6 opacity-60">
                        正在跳转至分析报告...
                      </p>
                    </>
                  )}

                  {state.status === 'error' && (
                    <>
                      <div className="text-6xl mb-6 text-red-500">✗</div>
                      <p className="text-lg mb-2 text-red-500">
                        {state.error}
                      </p>
                      <Button variant="editorial" onClick={resetUpload}>
                        重新上传
                      </Button>
                    </>
                  )}
                </div>
              </label>

              {/* 隐私承诺 */}
              <div className="flex flex-col gap-4 mt-12 pt-8 border-t border-border">
                <h3 className="meta-label text-accent">隐私承诺</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ 简历原文只在你的浏览器内处理</li>
                  <li>✓ 不上传到服务器，零上传</li>
                  <li>✓ PII 自动脱敏（手机/邮箱/身份证）</li>
                  <li>✓ AI 改写不编造数字、项目、技能</li>
                  <li>✓ 一键删除所有数据</li>
                </ul>
                <Link
                  href="/privacy"
                  className="text-xs text-accent hover:opacity-60 mt-2 inline-block"
                >
                  完整隐私政策 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="meta-label">{label}</div>
      <div className="text-lg mt-1">{value}</div>
    </div>
  );
}

function getStepNumber(status: ProcessStatus): number {
  const map: Record<ProcessStatus, number> = {
    idle: 0,
    parsing: 1,
    redacting: 2,
    extracting: 3,
    analyzing: 4,
    saving: 5,
    done: 5,
    error: 0,
  };
  return map[status];
}
