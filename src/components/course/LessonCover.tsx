"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface LessonCoverProps {
  order: number;
  title: string;
}

function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function LessonCover({ order, title }: LessonCoverProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

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

  return (
    <Image
      key={imageName}
      src={`/course/ai-asoslari/lesson-${lessonNumber}/${imageName}`}
      alt={`${title} darsi uchun cover rasm`}
      fill
      sizes="(max-width: 800px) 100vw, 50vw"
      className="lesson-cover"
    />
  );
}
