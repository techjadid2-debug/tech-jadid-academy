import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech Jadid — AI Video Creator & AI Builder",
  description:
    "O'zbek tilida amaliy AI ta'limi. Ikki kurs: AI Video Creator (AI rasm, video, ovoz, montaj) va AI Builder (website, AI web-app, Telegram bot, AI agent).",
};

// Sahifa yuklanishidan oldin temani qo'yish — "miltillash" (FOUC) bo'lmasligi uchun.
const themeInit = `
(function(){
  try {
    var saved = localStorage.getItem('theme');
    var mode = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', mode);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
