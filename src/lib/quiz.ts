import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getLessonId } from "@/lib/supabase/db";

// ============================================================================
// Savol/mashq (quiz) — Supabase-only xususiyat (demo rejimda bo'sh ro'yxat,
// xuddi to'lov demo rejimda mock bo'lgani kabi tabiiy cheklov).
//
// MUHIM: is_correct clientga BERILMAYDI — o'qish service role orqali, javob
// tekshiruvi faqat serverda (quiz-actions.ts). quiz_options'da anon select
// policy ataylab yo'q.
// ============================================================================

export interface QuizOptionView {
  id: string;
  text: string;
}

export interface QuizQuestionView {
  id: string;
  order: number;
  prompt: string;
  /** Faqat javob berilgandan keyin ko'rsatiladi (UI qaror qiladi). */
  explanation: string | null;
  points: number;
  options: QuizOptionView[];
}

export interface QuizAnswerState {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean;
}

/** Dars savollari (variantlar to'g'ri-belgisisiz). Demo rejimda []. */
export async function getLessonQuiz(slug: string, order: number): Promise<QuizQuestionView[]> {
  const admin = createSupabaseAdmin();
  if (!admin) return [];
  const lessonId = await getLessonId(slug, order);
  if (!lessonId) return [];

  const { data, error } = await admin
    .from("quiz_questions")
    .select("id, order, prompt, explanation, points, quiz_options ( id, order, text )")
    .eq("lesson_id", lessonId)
    .order("order", { ascending: true });
  if (error) {
    console.error("[quiz] getLessonQuiz failed", error);
    return [];
  }

  return (data ?? []).map((q) => ({
    id: q.id as string,
    order: q.order as number,
    prompt: q.prompt as string,
    explanation: (q.explanation as string | null) ?? null,
    points: q.points as number,
    options: [...(q.quiz_options as { id: string; order: number; text: string }[])]
      .sort((a, b) => a.order - b.order)
      .map((o) => ({ id: o.id, text: o.text })),
  }));
}

/** Foydalanuvchining berilgan savollarga javob holati. */
export async function getQuizAnswers(
  userId: string,
  questionIds: string[],
): Promise<Map<string, QuizAnswerState>> {
  const map = new Map<string, QuizAnswerState>();
  const admin = createSupabaseAdmin();
  if (!admin || questionIds.length === 0) return map;

  const { data, error } = await admin
    .from("quiz_answers")
    .select("question_id, selected_option_id, is_correct")
    .eq("user_id", userId)
    .in("question_id", questionIds);
  if (error) {
    console.error("[quiz] getQuizAnswers failed", error);
    return map;
  }

  for (const r of data ?? []) {
    map.set(r.question_id as string, {
      questionId: r.question_id as string,
      selectedOptionId: (r.selected_option_id as string | null) ?? null,
      isCorrect: r.is_correct as boolean,
    });
  }
  return map;
}
