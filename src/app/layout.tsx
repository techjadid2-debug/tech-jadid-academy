import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech Jadid — AI Video Creator & AI Builder",
  description:
    "O'zbek tilida amaliy AI ta'limi. Ikki kurs: AI Video Creator (AI rasm, video, ovoz, montaj) va AI Builder (website, AI web-app, Telegram bot, AI agent).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
