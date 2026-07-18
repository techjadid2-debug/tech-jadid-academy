import type { QuizAnswerState, QuizQuestionView } from "@/lib/quiz";
import { submitQuizAnswer } from "@/app/learn/quiz-actions";

// Server komponent — savollar dars sahifasida render qilinadi, javob
// server action orqali yuboriladi (JSsiz ham ishlaydi). To'g'ri javob
// belgilari clientga chiqmaydi.
export function LessonQuiz({
  slug,
  order,
  questions,
  answers,
}: {
  slug: string;
  order: number;
  questions: QuizQuestionView[];
  answers: Map<string, QuizAnswerState>;
}) {
  if (questions.length === 0) return null;

  return (
    <div style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>🧠 Bilimni tekshiring</h2>
      <p className="hint" style={{ marginBottom: 14 }}>
        Har bir to&apos;g&apos;ri javob ball beradi (faqat birinchi urinishda).
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 640 }}>
        {questions.map((q, i) => {
          const answer = answers.get(q.id);
          const solved = answer?.isCorrect === true;
          const wrong = answer !== undefined && !answer.isCorrect;

          return (
            <div
              key={q.id}
              id={`q-${q.id}`}
              className="panel"
              style={
                solved
                  ? { background: "color-mix(in srgb, var(--green) 8%, var(--card-bg))" }
                  : wrong
                    ? { background: "color-mix(in srgb, var(--red) 6%, var(--card-bg))" }
                    : undefined
              }
            >
              <div style={{ fontWeight: 600, marginBottom: 12 }}>
                {i + 1}. {q.prompt}{" "}
                <span className="hint" style={{ fontWeight: 400 }}>({q.points} ball)</span>
              </div>

              {solved ? (
                <>
                  <div className="badge badge-green" style={{ marginBottom: q.explanation ? 10 : 0 }}>
                    ✓ To&apos;g&apos;ri!
                  </div>
                  {q.explanation && <p className="hint">{q.explanation}</p>}
                </>
              ) : (
                <form action={submitQuizAnswer}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="order" value={order} />
                  <input type="hidden" name="questionId" value={q.id} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                    {q.options.map((o) => (
                      <label
                        key={o.id}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          padding: "10px 12px",
                          border: "1px solid var(--line)",
                          borderRadius: 10,
                          cursor: "pointer",
                          fontSize: 14,
                          background:
                            wrong && answer?.selectedOptionId === o.id
                              ? "color-mix(in srgb, var(--red) 10%, transparent)"
                              : "var(--mist)",
                        }}
                      >
                        <input type="radio" name="optionId" value={o.id} required style={{ width: 16, height: 16, flexShrink: 0 }} />
                        <span>{o.text}</span>
                      </label>
                    ))}
                  </div>
                  {wrong && (
                    <p className="hint" style={{ color: "var(--red)", marginBottom: 10 }}>
                      ✗ Noto&apos;g&apos;ri — yana urinib ko&apos;ring.
                    </p>
                  )}
                  <button type="submit" className="btn btn-primary" style={{ padding: "9px 18px", fontSize: 14 }}>
                    Javobni tekshirish
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
