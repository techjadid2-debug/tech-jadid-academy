"use client";

import { useState } from "react";
import { submitLessonAssessment } from "@/app/learn/assessment-actions";

export interface AssessmentQuestionView { id: string; prompt: string; options: string[]; }
export interface AssessmentStatusView { attempts: number; bestScore: number; passed: boolean; overridden: boolean; }

export function LessonAssessment({ slug, order, questions, status }: { slug: string; order: number; questions: AssessmentQuestionView[]; status: AssessmentStatusView }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const available = !status.passed && status.attempts < 3;
  const answeredAll = questions.every((_, index) => answers[index] !== undefined);
  return (
    <section className="lesson-assessment" id="assessment" aria-label="Dars yakuniy testi">
      <span className="page-eyebrow">Dars yakuniy testi</span>
      <h2>10 savol · o‘tish uchun 9 ta to‘g‘ri javob</h2>
      {status.passed ? <p className="assessment-success">✓ {status.overridden ? "Ustoz ruxsati bilan" : `${status.bestScore}/10 natija bilan`} keyingi dars ochildi.</p>
        : status.attempts >= 3 ? <p className="assessment-locked">3 urinish tugadi. Eng yaxshi natija: {status.bestScore}/10. Davom etish uchun ustoz ruxsatini kuting.</p>
        : <p className="hint">Urinish: {status.attempts + 1} / 3. Har savolga javob bering.</p>}
      {available && <form action={submitLessonAssessment}>
        <input type="hidden" name="slug" value={slug} /><input type="hidden" name="order" value={order} />
        <div className="assessment-list">
          {questions.map((question, index) => <fieldset key={question.id} className="assessment-question"><legend>{index + 1}. {question.prompt}</legend>
            {question.options.map((option, optionIndex) => <label key={option}><input required type="radio" name={`answer-${index}`} value={optionIndex} onChange={() => setAnswers((current) => ({ ...current, [index]: String(optionIndex) }))} />{option}</label>)}
          </fieldset>)}
        </div>
        <button type="submit" className="btn btn-primary" disabled={!answeredAll}>Testni yuborish</button>
      </form>}
    </section>
  );
}
