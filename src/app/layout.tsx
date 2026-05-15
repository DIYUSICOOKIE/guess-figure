import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '猜历史人物',
  description: 'AI 随机想一个中国古代人物，通过提问逐步缩小范围，猜出人物名称',
  viewport: 'width=device-width, initial-scale=1, user-scalable=no',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-[#fefce8]">{children}</body>
    </html>
  );
}
