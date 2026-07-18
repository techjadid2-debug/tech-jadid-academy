"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessLesson } from "@/lib/access";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getLessonId } from "@/lib/supabase/db";
import { recordActivity } from "@/lib/gamification";

/**
 * Savolga javobni qabul qiladi. To'g'riligini FAQAT server tekshiradi
 * (clientda is_correct yo'q). Ball faqat BIRINCHI to'g'ri javobda beriladi
 * (first_correct_at) — qayta urinishlar ball qo'shmaydi.
 */
export async function submitQuizAnswer(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const order = Number(formData.get("order") ?? 0);
  const questionId = String(formData.get("questionId") ?? "");
  const optionId = String(formData.get("optionId") ?? "");
  const backUrl = `/learn/${slug}/${order}#q-${questionId}`;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/learn/${slug}/${order}`)}`);
  if (!questionId || !optionId) redirect(backUrl);

  // Qulflangan dars savoliga javob berib bo'lmaydi.
  if (!(await canAccessLesson(user.id, slug, order))) redirect(`/kurs/${slug}#narx`);

  const admin = createSupabaseAdmin();
  if (!admin) redirect(backUrl); // demo rejimda savollar ko'rsatilmaydi

  // Savol haqiqatan shu darsniki ekanini tekshiramiz (id o'ynatishga qarshi).
  const lessonId = await getLessonId(slug, order);
  const { data: question } = await admin
    .from("quiz_questions")
    .select("id, lesson_id, points, quiz_options ( id, is_correct )")
    .eq("id", questionId)
    .maybeSingle();
  if (!question || question.lesson_id !== lessonId) redirect(backUrl);

  const option = (question.quiz_options as { id: string; is_correct: boolean }[]).find(
    (o) => o.id === optionId,
  );
  if (!option) redirect(backUrl);

  // Savol javobi va first-correct ball claim'i DB lock ostida atomik bajariladi.
  const { data: claimed, error } = await admin.rpc("submit_quiz_answer_claim", {
    p_user_id: user.id,
    p_question_id: questionId,
    p_option_id: optionId,
    p_is_correct: option.is_correct,
  });
  if (error) {
    console.error("[quiz] submitQuizAnswer failed", error);
  } else if (claimed === true && option.is_correct) {
    await recordActivity(user.id, { quizCorrect: 1, points: (question.points as number) ?? 10 });
  }

  redirect(backUrl);
}
