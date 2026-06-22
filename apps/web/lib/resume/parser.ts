/**
 * 简历解析器 - PDF/DOCX 客户端解析
 *
 * 核心设计：
 * 1. 全部在浏览器端解析，简历原文永不上传
 * 2. PII 自动脱敏后，才传给 LLM 做结构化提取
 * 3. 使用 PDF.js 解析 PDF，Mammoth.js 解析 Word
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// 配置 PDF.js worker（使用 CDN，避免 webpack 打包问题）
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export type SupportedFileType = 'pdf' | 'docx' | 'doc';

export interface ParsedResume {
  /** 原始文本（仅客户端） */
  rawText: string;
  /** 文件元数据 */
  metadata: {
    fileName: string;
    fileType: SupportedFileType;
    fileSize: number;
    pageCount?: number;
  };
  /** 解析耗时（毫秒）*/
  parseDurationMs: number;
}

/**
 * 检测文件类型
 */
export function detectFileType(file: File): SupportedFileType | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.doc')) return 'doc';
  return null;
}

/**
 * 解析 PDF 简历（客户端）
 */
export async function parsePdfResume(file: File): Promise<ParsedResume> {
  const startTime = Date.now();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      // 禁用自动下载字体（避免网络请求）
      disableFontFace: true,
      // 禁用自动下载图片
      disableAutoFetch: true,
    });

    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    // 逐页提取文本
    const textParts: string[] = [];
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');
      textParts.push(pageText);
    }

    const rawText = textParts.join('\n\n').trim();

    return {
      rawText,
      metadata: {
        fileName: file.name,
        fileType: 'pdf',
        fileSize: file.size,
        pageCount,
      },
      parseDurationMs: Date.now() - startTime,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ResumeParseError(
      `PDF 解析失败: ${message}`,
      'pdf',
      error
    );
  }
}

/**
 * 解析 Word 简历（客户端）
 */
export async function parseDocxResume(file: File): Promise<ParsedResume> {
  const startTime = Date.now();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const rawText = result.value.trim();

    return {
      rawText,
      metadata: {
        fileName: file.name,
        fileType: 'docx',
        fileSize: file.size,
      },
      parseDurationMs: Date.now() - startTime,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ResumeParseError(
      `Word 解析失败: ${message}`,
      'docx',
      error
    );
  }
}

/**
 * 统一入口：自动识别文件类型并解析
 */
export async function parseResume(file: File): Promise<ParsedResume> {
  const fileType = detectFileType(file);
  if (!fileType) {
    throw new ResumeParseError(
      `不支持的文件类型: ${file.name}。仅支持 PDF、DOCX、DOC`,
      null,
      null
    );
  }

  // 文件大小限制（10MB）
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new ResumeParseError(
      `文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），请使用 10MB 以内的简历`,
      fileType,
      null
    );
  }

  if (fileType === 'pdf') {
    return parsePdfResume(file);
  } else {
    return parseDocxResume(file);
  }
}

/**
 * 简历解析错误
 */
export class ResumeParseError extends Error {
  constructor(
    message: string,
    public readonly fileType: SupportedFileType | null,
    public readonly cause: unknown
  ) {
    super(message);
    this.name = 'ResumeParseError';
  }
}
