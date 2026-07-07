"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hasAccess } from "@/lib/access";
import { setCompleted } from "@/lib/progress";
import { getCourse, getLesson, allLessons } from "@/lib/course-data";

/** Darsni yakunlangan deb belgilaydi va keyingi darsga (yoki kabinetga) o'tadi. */
export async function completeAndNext(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const order = Number(formData.get("order") ?? 0);

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/learn/${slug}/${order}`)}`);

  const course = getCourse(slug);
  if (!course || !getLesson(course, order)) redirect("/");

  // Faqat kirish huquqi bo'lsa progress yoziladi.
  if (await hasAccess(user.id, slug)) {
    await setCompleted(user.id, slug, order, true);
  }

  const lessons = allLessons(course);
  const idx = lessons.findIndex((l) => l.order === order);
  const next = lessons[idx + 1];

  if (next) redirect(`/learn/${slug}/${next.order}`);
  redirect(`/learn/${slug}/${order}?done=1`);
}

/** Yakunlash belgisini olib tashlaydi (shu darsda qoladi). */
export async function unmarkComplete(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const order = Number(formData.get("order") ?? 0);

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await setCompleted(user.id, slug, order, false);
  redirect(`/learn/${slug}/${order}`);
}
