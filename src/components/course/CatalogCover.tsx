import type { ReactNode } from "react";

// Kurs mavzusiga mos SVG motiv (rasmsiz cover banner uchun). Brend "aurora"
// gradient CSS'da (.catalog-cover::before); bu yerda faqat oq motiv.
// viewBox: 0 0 400 175 (~16:7 banner).

const VIDEO_MOTIF: ReactNode = (
  <g fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {/* Kichik film kadri (chapda) */}
    <rect x="66" y="58" width="40" height="30" rx="6" opacity="0.55" />
    <path d="M66 68 h40 M76 58 v30 M96 58 v30" opacity="0.35" />
    {/* Asosiy video oynasi */}
    <rect x="146" y="40" width="120" height="76" rx="12" fill="#fff" fillOpacity="0.08" opacity="0.95" />
    {/* Play tugma */}
    <path d="M192 62 L222 78 L192 94 Z" fill="#fff" stroke="none" />
    {/* Sparkle (o'ngda) */}
    <path d="M312 50 l3.5 9 9 3.5 -9 3.5 -3.5 9 -3.5 -9 -9 -3.5 9 -3.5 z" fill="#fff" stroke="none" opacity="0.85" />
    {/* Montaj timeline */}
    <path d="M108 140 H292" opacity="0.5" />
    <circle cx="132" cy="140" r="5.5" fill="#fff" stroke="none" opacity="0.9" />
    <circle cx="200" cy="140" r="5.5" fill="#fff" stroke="none" opacity="0.55" />
    <circle cx="268" cy="140" r="5.5" fill="#fff" stroke="none" opacity="0.9" />
  </g>
);

const BUILDER_MOTIF: ReactNode = (
  <g fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    {/* Kod oynasi */}
    <rect x="96" y="40" width="150" height="92" rx="12" fill="#fff" fillOpacity="0.08" opacity="0.95" />
    <path d="M96 60 H246" opacity="0.4" />
    <circle cx="110" cy="50" r="2.6" fill="#fff" stroke="none" opacity="0.7" />
    <circle cx="120" cy="50" r="2.6" fill="#fff" stroke="none" opacity="0.5" />
    <circle cx="130" cy="50" r="2.6" fill="#fff" stroke="none" opacity="0.35" />
    {/* </> belgisi */}
    <path d="M140 78 l-12 10 12 10" />
    <path d="M202 78 l12 10 -12 10" />
    <path d="M178 74 l-14 28" opacity="0.85" />
    {/* Chat bubble (o'ng yuqori) */}
    <path d="M276 52 h48 a10 10 0 0 1 10 10 v20 a10 10 0 0 1 -10 10 h-30 l-14 12 v-12 a10 10 0 0 1 -4 -8 v-22 a10 10 0 0 1 10 -10 z" fill="#fff" fillOpacity="0.08" opacity="0.85" />
    <circle cx="292" cy="72" r="2.8" fill="#fff" stroke="none" />
    <circle cx="304" cy="72" r="2.8" fill="#fff" stroke="none" />
    <circle cx="316" cy="72" r="2.8" fill="#fff" stroke="none" />
    {/* Agent/tarmoq tugunlari (pastda) */}
    <path d="M150 150 L200 138 L250 150" opacity="0.5" />
    <circle cx="150" cy="150" r="6" fill="#fff" stroke="none" opacity="0.9" />
    <circle cx="200" cy="138" r="6" fill="#fff" stroke="none" opacity="0.9" />
    <circle cx="250" cy="150" r="6" fill="#fff" stroke="none" opacity="0.9" />
  </g>
);

const MOTIFS: Record<string, ReactNode> = {
  "ai-video-creator": VIDEO_MOTIF,
  "ai-builder": BUILDER_MOTIF,
};

export function CatalogCover({ slug }: { slug: string }) {
  return (
    <div className="catalog-cover" aria-hidden="true">
      <svg className="catalog-cover-art" viewBox="0 0 400 175" preserveAspectRatio="xMidYMid slice" role="presentation">
        {MOTIFS[slug] ?? VIDEO_MOTIF}
      </svg>
    </div>
  );
}
