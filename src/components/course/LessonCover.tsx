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
  const [failedSources, setFailedSources] = useState<string[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setTheme(getTheme());
    const observer = new MutationObserver(syncTheme);

    syncTheme();
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const lessonNumber = String(order).padStart(2, "0");
  const imageSrc = `/course/${slug}/lesson-${lessonNumber}/cover-${theme}.webp`;
  const failed = failedSources.includes(imageSrc);
  const accent = ACCENTS[(order - 1) % ACCENTS.length];

  return (
    <>
      {failed ? (
      <div
        className="lesson-cover lesson-cover-fallback"
        aria-label={`${title} darsi uchun cover`}
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 22%, var(--card-bg)), var(--card-bg))`,
        }}
      />
      ) : (
        <Image
          key={imageSrc}
          src={imageSrc}
          alt={`${title} darsi uchun cover rasm`}
          fill
          sizes="(max-width: 800px) 100vw, 50vw"
          className="lesson-cover"
          onError={() =>
            setFailedSources((current) =>
              current.includes(imageSrc) ? current : [...current, imageSrc],
            )
          }
        />
      )}
      <span className="lesson-cover-num" style={{ color: accent }} aria-hidden="true">
        {lessonNumber}
      </span>
    </>
  );
}
