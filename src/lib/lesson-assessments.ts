import "server-only";

import { cookies } from "next/headers";
import type { Lesson } from "@/lib/types";
import { getCourseAsync } from "@/lib/course";
import { getLesson } from "@/lib/course-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getLessonId } from "@/lib/supabase/db";

export interface AssessmentQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface AssessmentStatus {
  attempts: number;
  bestScore: number;
  passed: boolean;
  overridden: boolean;
}

const COOKIE = "tj_assessments";
type StoredStatus = Record<string, AssessmentStatus>;
const keyOf = (userId: string, slug: string, order: number) => `${userId}:${slug}:${order}`;

function short(text: string) {
  return text.replace(/\.$/, "");
}

/** Har dars uchun 10 ta serverda tekshiriladigan test savoli. */
export function buildAssessment(lesson: Lesson): AssessmentQuestion[] {
  const theory = lesson.rows.find((row) => row.kind === "Nazariy")?.text ?? lesson.title;
  const practice = lesson.rows.find((row) => row.kind === "Amaliy")?.text ?? lesson.title;
  const result = lesson.rows.find((row) => row.kind === "Natija")?.text ?? lesson.title;
  const answer = (id: string, prompt: string, correct: string, wrongA: string, wrongB: string): AssessmentQuestion => ({
    id, prompt, options: [correct, wrongA, wrongB], correctIndex: 0,
  });
  return [
    answer("q1", `“${lesson.title}” darsining asosiy maqsadi nima?`, short(result), "Faqat nazariy atamalarni yodlash", "Keyingi darsni o'tkazib yuborish"),
    answer("q2", "Darsdagi nazariy qism nimaga qaratilgan?", short(theory), "Faqat narxlarni solishtirish", "Tayyor javobni tekshirmaslik"),
    answer("q3", "Jonli amaliyotda qaysi ish bajariladi?", short(practice), "Natijani saqlamasdan yopish", "Mavzuga aloqasiz vosita tanlash"),
    answer("q4", "Dars yakunida qaysi yondashuv to'g'ri?", "Natijani tekshirib, real vazifaga moslashtirish", "AI javobini ko'rmasdan yuborish", "Faqat bitta tasodifiy urinish qilish"),
    answer("q5", "AI bilan ishlaganda muhim qoida qaysi?", "Muhim fakt va xulosalarni tekshirish", "Har bir javobni darhol haqiqat deb olish", "Kontekstsiz topshiriq berish"),
    answer("q6", "Amaliy topshiriqdagi foydali natijani nima qilish kerak?", "Saqlab, keyingi ish jarayonida qayta ishlatish", "Darhol o'chirib tashlash", "Boshqa mavzu bilan almashtirish"),
    answer("q7", "Agar birinchi natija mos kelmasa nima qilinadi?", "Ko'rsatmani aniqlashtirib, qayta sinab ko'riladi", "Tekshirmasdan yakun deb qabul qilinadi", "Darsni to'xtatish shart"),
    answer("q8", "Darsdagi real natija nimaga xizmat qiladi?", "O'z ish jarayoningizni tezlashtirishga", "Faqat test ballini ko'rsatishga", "Kursdan tashqarida ishlatmaslikka"),
    answer("q9", "Ustozga qaysi holatda savol berish foydali?", "Natija noaniq bo'lsa yoki amaliyotda to'siq chiqsa", "Hammasi tushunarli bo'lganda ham hech qanday sabab yo'q", "Javobni tekshirish kerak bo'lmaganda"),
    answer("q10", "Keyingi mavzuga o'tishdan oldin nima qilasiz?", "Dars materialini yakunlab, 10 savolli testni topshiraman", "Slaydlarni ko'rmasdan o'taman", "Natijani saqlamasdan yopaman"),
  ];
}

export async function getAssessmentForLesson(slug: string, order: number) {
  const course = await getCourseAsync(slug);
  const found = course ? getLesson(course, order) : undefined;
  return found ? buildAssessment(found.lesson) : [];
}

export async function getAssessmentStatus(userId: string, slug: string, order: number): Promise<AssessmentStatus> {
  const empty = { attempts: 0, bestScore: 0, passed: false, overridden: false };
  if (!isSupabaseConfigured || !createSupabaseAdmin()) {
    const store = await readCookieStore();
    return store[keyOf(userId, slug, order)] ?? empty;
  }
  const lessonId = await getLessonId(slug, order);
  if (!lessonId) return empty;
  const admin = createSupabaseAdmin();
  const { data } = await admin!.from("lesson_assessment_attempts")
    .select("attempt_no, score, passed, is_override")
    .eq("user_id", userId).eq("lesson_id", lessonId);
  const rows = data ?? [];
  return {
    attempts: rows.filter((row) => !(row.is_override as boolean)).length,
    bestScore: Math.max(0, ...rows.map((row) => Number(row.score))),
    passed: rows.some((row) => Boolean(row.passed)),
    overridden: rows.some((row) => Boolean(row.is_override)),
  };
}

export async function isLessonCleared(userId: string, slug: string, order: number) {
  return (await getAssessmentStatus(userId, slug, order)).passed;
}

export async function submitAssessmentAttempt(userId: string, slug: string, order: number, answers: string[]) {
  const questions = await getAssessmentForLesson(slug, order);
  const current = await getAssessmentStatus(userId, slug, order);
  if (questions.length !== 10 || current.passed || current.attempts >= 3) return current;
  const score = questions.reduce((total, question, index) => total + (Number(answers[index]) === question.correctIndex ? 1 : 0), 0);
  const passed = score >= 9;
  const next = { attempts: current.attempts + 1, bestScore: Math.max(current.bestScore, score), passed, overridden: false };

  if (!isSupabaseConfigured || !createSupabaseAdmin()) {
    const store = await readCookieStore();
    store[keyOf(userId, slug, order)] = next;
    await writeCookieStore(store);
    return next;
  }
  const lessonId = await getLessonId(slug, order);
  if (!lessonId) return current;
  const { error } = await createSupabaseAdmin()!.from("lesson_assessment_attempts").insert({
    user_id: userId, lesson_id: lessonId, attempt_no: next.attempts, score, passed, is_override: false,
  });
  if (error) throw new Error("Test natijasini saqlab bo'lmadi.");
  return next;
}

export async function grantAssessmentOverride(userId: string, slug: string, order: number) {
  if (!isSupabaseConfigured || !createSupabaseAdmin()) return;
  const lessonId = await getLessonId(slug, order);
  if (!lessonId) return;
  const status = await getAssessmentStatus(userId, slug, order);
  const { error } = await createSupabaseAdmin()!.from("lesson_assessment_attempts").upsert({
    user_id: userId, lesson_id: lessonId, attempt_no: 4, score: status.bestScore, passed: true, is_override: true,
  }, { onConflict: "user_id,lesson_id,attempt_no" });
  if (error) throw new Error("Ustoz ruxsatini saqlab bo'lmadi.");
}

async function readCookieStore(): Promise<StoredStatus> {
  const value = (await cookies()).get(COOKIE)?.value;
  try { return value ? JSON.parse(value) as StoredStatus : {}; } catch { return {}; }
}

async function writeCookieStore(value: StoredStatus) {
  (await cookies()).set(COOKIE, JSON.stringify(value), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
}
