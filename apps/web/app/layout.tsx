import type { Metadata } from 'next';
import './globals.css';

/**
 * 设计规范：黑底白字红字点缀
 * 中文界面（zh-CN）
 */

export const metadata: Metadata = {
  title: '再出发 — Reinvention Suite',
  description: '三十五岁以上求职者免费再就业助手',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
