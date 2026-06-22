import type { Metadata } from 'next';
import './globals.css';

/**
 * japanese-ma-minimalism 字体系统
 *
 * 注意：由于构建环境无法访问 Google Fonts，我们使用 CSS @font-face + 系统字体回退
 * 系统字体优先级：
 * - 衬线（Display）：'Iowan Old Style', 'Apple Garamond', Baskerville, Georgia, serif
 * - 无衬线（UI）：'Optima', 'Avenir Next', 'Avenir', 'Trebuchet MS', sans-serif
 * - 等宽：'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace
 * - CJK 衬线：'Hiragino Mincho ProN', 'Yu Mincho', 'Songti SC', serif
 * - CJK 无衬线：'Hiragino Sans', 'Yu Gothic', 'PingFang SC', sans-serif
 */

export const metadata: Metadata = {
  title: '再出発 — Reinvention Suite',
  description: '三十五歳以上、仮採用無料助手',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
