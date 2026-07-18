"use client";

import { useState } from "react";
import type { LessonReview as Review } from "@/lib/lesson-reviews";

export function LessonReview({ review }: { review: Review }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = selected === review.correctIndex;

  return (
    <section className="lesson-review" aria-label="Mavzulararo test">
      <span className="page-eyebrow">Mavzudan keyingi test</span>
      <h2>Keyingi darsga tayyormisiz?</h2>
      <p className="lesson-review-question">{review.question}</p>
      <div className="lesson-review-options">
        {review.options.map((option, index) => (
          <label key={option} className={checked ? index === review.correctIndex ? "correct" : index === selected ? "incorrect" : "" : ""}>
            <input type="radio" name="lesson-review" checked={selected === index} onChange={() => { setSelected(index); setChecked(false); }} />
            {option}
          </label>
        ))}
      </div>
      {checked && <p className={correct ? "review-result correct" : "review-result incorrect"}>{correct ? "✓ To'g'ri! " : "Qayta urinib ko'ring. "}{review.explanation}</p>}
      <button type="button" className="btn btn-primary" disabled={selected === null} onClick={() => setChecked(true)}>
        Javobni tekshirish
      </button>
    </section>
  );
}
