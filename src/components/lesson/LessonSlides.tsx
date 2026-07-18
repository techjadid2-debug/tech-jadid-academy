"use client";

import { useState } from "react";
import type { Lesson } from "@/lib/types";
import { getInfographicSlides, LessonInfographic } from "@/components/lesson/LessonInfographic";

/** Darsga xos 10 ta bilimli, responsive infografika. */
export function LessonSlides({ lesson }: { lesson: Lesson }) {
  const [active, setActive] = useState(0);
  const slides = getInfographicSlides(lesson);
  const slide = slides[active];
  return <section className="lesson-slides" aria-label="10 slaydli dars materiallari">
    <div className="slide-progress">{slides.map((item, index) => <span key={item.label} className={index === active ? "active" : index < active ? "done" : ""} />)}</div>
    <div className="slide-canvas slide-topic">
      <LessonInfographic slide={slide} lessonTitle={lesson.title} />
      <div className="slide-copy"><span className="slide-label">{slide.label}</span><h2>{slide.title}</h2><p className="slide-lead">{slide.body}</p><p className="slide-instructor"><b>Ustoz eslatmasi:</b> {slide.instructorNote ?? "Avval sxemani izohlang, keyin o'quvchilardan o'z ishiga mos bitta misol so'rang."}</p>{slide.prompt ? <details className="slide-cheatsheet"><summary>Tayyor prompt shpargalkasi</summary><pre>{slide.prompt}</pre></details> : null}</div>
    </div>
    <div className="slide-controls"><button type="button" className="btn btn-ghost" onClick={() => setActive((n) => Math.max(0, n - 1))} disabled={active === 0}>← Oldingi</button><span>{active + 1} / 10</span><button type="button" className="btn btn-primary" onClick={() => setActive((n) => Math.min(9, n + 1))} disabled={active === 9}>Keyingi →</button></div>
  </section>;
}
