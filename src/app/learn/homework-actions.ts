"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canAccessLesson } from "@/lib/access";
import { getCourseAsync } from "@/lib/course";
import { getLesson } from "@/lib/course-data";
import { submitHomework } from "@/lib/homework";

/** O'quvchi uy vazifasini (matn + havola + fayl) topshiradi; AI darhol dastlabki baho beradi. */
export async function submitHomeworkAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  const order = Number(formData.get("order") ?? 0);

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/learn/${slug}/${order}`)}`);
  if (!(await canAccessLesson(user.id, slug, order))) redirect(`/kurs/${slug}#narx`);

  const course = await getCourseAsync(slug);
  const found = course ? getLesson(course, order) : undefined;
  if (!course || !found) redirect("/");

  const text = String(formData.get("text") ?? "");
  const link = String(formData.get("link") ?? "");
  const fileEntry = formData.get("file");
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  const filePath = String(formData.get("filePath") ?? "");
  const fileName = String(formData.get("fileName") ?? "");

  await submitHomework(user.id, slug, order, found.lesson, found.module.title, course.title, { text, link, file, filePath, fileName });

  redirect(`/learn/${slug}/${order}#uy-vazifasi`);
}
