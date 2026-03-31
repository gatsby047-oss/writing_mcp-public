import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "AI Persona Studio",
  description:
    "一个会记住写作偏好、通过采纳行为持续学习的 AI 写作工作台。",
};

const sansFont = Noto_Sans_SC({
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
  variable: "--font-sans",
});

const serifFont = Noto_Serif_SC({
  weight: ["500", "700"],
  display: "swap",
  preload: false,
  variable: "--font-serif",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${sansFont.variable} ${serifFont.variable} ${monoFont.variable}`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
