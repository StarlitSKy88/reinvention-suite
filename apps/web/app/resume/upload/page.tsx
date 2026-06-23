/**
 * 简历上传页面 — 黑底白字红字点缀
 *
 * 拖拽上传 + 客户端 PDF/DOCX 解析 + PII 脱敏
 * 完全在浏览器端处理，简历原文不上传
 */

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface UploadState {
  status: 'idle' | 'parsing' | 'redacting' | 'extracting' | 'done' | 'error';
  progress: number;
  message: string;
  error?: string;
}

export default function ResumeUploadPage() {
  const router = useRouter();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({
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

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFile(selectedFile);
  }, []);

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
      // 1. 客户端解析
      setState({
        status: 'parsing',
        progress: 20,
        message: '正在解析 PDF...',
      });

      const { parseResume } = await import('@/lib/resume');
      const parsed = await parseResume(selectedFile);

      // 2. PII 脱敏
      setState({
        status: 'redacting',
        progress: 50,
        message: '正在脱敏个人信息...',
      });

      const { redactPII } = await import('@/lib/privacy/redactor');
      const redacted = redactPII(parsed.rawText);

      // 3. LLM 提取结构化
      setState({
        status: 'extracting',
        progress: 80,
        message: '正在提取简历结构...',
      });

      const userId = 'demo-user'; // TODO: 真实 userId
      const { extractResumeStructured } = await import('@/lib/resume/extractor');
      const extracted = await extractResumeStructured(
        redacted.redactedText,
        userId
      );

      // 4. 保存到客户端 IndexedDB
      const { getDB } = await import('@/lib/db/schema');
      const db = getDB();

      const resumeId = await db.resumesStructured.add({
        userId,
        name: extracted.data.name,
        contact: extracted.data.contact,
        experiences: extracted.data.experiences,
        education: extracted.data.education,
        skills: extracted.data.skills,
        projects: extracted.data.projects,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      });

      setState({
        status: 'done',
        progress: 100,
        message: '简历解析完成！',
      });

      // 跳转到分析页
      setTimeout(() => {
        router.push(`/resume/analyze?id=${resumeId}`);
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
                <Link
                  href="/"
                  className="meta-label hover:opacity-50 transition-opacity"
                >
                  ← 返回首页
                </Link>
              </div>

              <h1 className="editorial-title text-display-sm">
                上传<br />简历
              </h1>

              <p className="text-muted-foreground leading-relaxed">
                简历原文只在你的浏览器内处理，**不会上传服务器**。
                我们会自动识别并脱敏手机号、邮箱等个人信息。
              </p>

              {/* 上传区 */}
              <label
                htmlFor="file-upload"
                className={`block border-2 border-dashed cursor-pointer transition-all duration-600 ${
                  dragOver
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50'
                }`}
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

                  {(state.status === 'parsing' ||
                    state.status === 'redacting' ||
                    state.status === 'extracting') && (
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
                      <p className="meta-label mt-4">{state.progress}%</p>
                    </>
                  )}

                  {state.status === 'done' && file && (
                    <>
                      <div className="text-6xl mb-6 text-accent">✓</div>
                      <p className="text-lg mb-2">{file.name}</p>
                      <p className="meta-label text-accent">{state.message}</p>
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
                <h3 className="meta-label text-accent">我们的承诺</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ 简历原文只在你的浏览器内处理</li>
                  <li>✓ 不上传到服务器，零上传</li>
                  <li>✓ PII 自动脱敏（手机/邮箱/身份证）</li>
                  <li>✓ AI 改写不编造数字、项目、技能</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
