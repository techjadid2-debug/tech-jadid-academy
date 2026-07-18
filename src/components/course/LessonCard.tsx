import Link from "next/link";
import type { Lesson } from "@/lib/types";
import { LessonCover } from "@/components/course/LessonCover";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDur(sec: number) {
  if (!sec) return "00:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${pad(m)}:${pad(s)}`;
}

interface LessonCardProps {
  lesson: Lesson;
  /** Bosilganda ochiladigan URL (bo'lsa — karta havolaga aylanadi) */
  href?: string;
  /** Landing'da scroll-reveal animatsiyasi kerak bo'lsa */
  reveal?: boolean;
  /** Foydalanuvchining bu darsga kirish huquqi bormi (qulf belgisi uchun) */
  unlocked?: boolean;
}

export function LessonCard({ lesson, href, reveal, unlocked }: LessonCardProps) {
  const inner = (
    <>
      <div className="vframe">
        <LessonCover order={lesson.order} title={lesson.title} />
        {lesson.isPreview ? (
          <span className="vf-lock vf-free">Bepul tanishuv</span>
        ) : unlocked ? null : (
          <span className="vf-lock">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Qulflangan
          </span>
        )}
        <span className="vf-tag">Dars {pad(lesson.order)} · Jonli dars shpargalkasi</span>
        {lesson.durationSec > 0 && <span className="vf-dur">{formatDur(lesson.durationSec)}</span>}
      </div>
      <div className="c-body">
        <div className="c-num">{pad(lesson.order)}</div>
        <h3>{lesson.title}</h3>
        <div className="rows">
          {lesson.rows.map((r) => (
            <div className="row" key={r.kind}>
              <span className={`tag${r.kind === "Natija" ? " out" : ""}`}>{r.kind}</span>
              <span className="txt">{r.text}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const className = `card${reveal ? " reveal" : ""}${href ? "" : " is-static"}`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return <article className={className}>{inner}</article>;
}
