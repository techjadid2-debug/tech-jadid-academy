"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessLesson } from "@/lib/access";
import { submitAssessmentAttempt } from "@/lib/lesson-assessments";

export async function submitLessonAssessment(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const order = Number(formData.get("order") ?? 0);
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/learn/${slug}/${order}`)}`);
  if (!slug || !order || !(await canAccessLesson(user.id, slug, order))) redirect(`/kurs/${slug}#narx`);
  const answers = Array.from({ length: 10 }, (_, index) => String(formData.get(`answer-${index}`) ?? ""));
  await submitAssessmentAttempt(user.id, slug, order, answers);
  redirect(`/learn/${slug}/${order}#assessment`);
}
