import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '再出发 Reinvention Suite',
  description:
    '35+ 失业群体再就业免费助手 — 全网匹配企业，主动协助弥补能力差距',
  keywords: [
    '35岁失业',
    '再就业',
    'AI求职',
    '简历优化',
    '再就业服务',
    '稳就业',
  ],
  authors: [{ name: 'Reinvention Team' }],
  openGraph: {
    title: '再出发 — 让 35+ 不必再假装 25',
    description: '免费帮助 35+ 失业群体再就业',
    type: 'website',
    locale: 'zh_CN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
