"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface LessonCoverProps {
  order: number;
  title: string;
  /** Kurs slug'i — rasm yo'li shu bo'yicha quriladi */
  slug: string;
}

function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

// Modul rangini takrorlaydigan gradient fallback (rasm bo'lmasa ham chiroyli ko'rinadi).
const ACCENTS = ["var(--blue)", "var(--red)", "var(--yellow)", "var(--green)"];

export function LessonCover({ order, title, slug }: LessonCoverProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setTheme(getTheme());
    const observer = new MutationObserver(syncTheme);

    syncTheme();
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const lessonNumber = String(order).padStart(2, "0");
  const imageName = theme === "dark" ? "cover-dark.webp" : "cover.webp";
  const accent = ACCENTS[(order - 1) % ACCENTS.length];

  if (failed) {
    return (
      <div
        className="lesson-cover lesson-cover-fallback"
        aria-label={`${title} darsi uchun cover`}
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 22%, var(--card-bg)), var(--card-bg))`,
        }}
      >
        <span className="lesson-cover-num" style={{ color: accent }}>{lessonNumber}</span>
      </div>
    );
  }

  return (
    <Image
      key={imageName}
      src={`/course/${slug}/lesson-${lessonNumber}/${imageName}`}
      alt={`${title} darsi uchun cover rasm`}
      fill
      sizes="(max-width: 800px) 100vw, 50vw"
      className="lesson-cover"
      onError={() => setFailed(true)}
    />
  );
}
