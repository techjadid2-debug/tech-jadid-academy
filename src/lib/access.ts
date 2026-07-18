import "server-only";
import { cookies } from "next/headers";
import type { Enrollment, EnrollmentSource } from "./types";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCourseId } from "@/lib/supabase/db";
import { isLessonCleared } from "@/lib/lesson-assessments";

// ============================================================================
// Kirish nazorati (enrollment) — dual-mode.
//
// REAL rejim: Supabase `enrollments` jadvali (o'qish RLS, yozish service role).
// DEMO rejim: `tj_enroll` cookie'da JSON ro'yxat.
// ============================================================================

const ENROLL_COOKIE = "tj_enroll";

/** "2 bo'lib to'lash"da 1-to'lovdan keyin ochiladigan oxirgi dars tartibi. */
export const INSTALLMENT_FIRST_UNLOCK = 8;

export async function getEnrollments(userId: string): Promise<Enrollment[]> {
  if (isSupabaseConfigured) return getDbEnrollments(userId);
  const all = await readCookieEnrollments();
  return all.filter((e) => e.userId === userId);
}

/** Yozilish muddati o'tganmi (lifetime uchun har doim false). */
export function isEnrollmentExpired(enrollment: Pick<Enrollment, "expiresAt">): boolean {
  return enrollment.expiresAt !== null && new Date(enrollment.expiresAt).getTime() <= Date.now();
}

/** Foydalanuvchining kursga amaldagi (muddati o'tmagan) yozilishi — bo'lsa qaytaradi. */
export async function getActiveEnrollment(userId: string, courseSlug: string): Promise<Enrollment | null> {
  const list = await getEnrollments(userId);
  return list.find((e) => e.courseSlug === courseSlug && !isEnrollmentExpired(e)) ?? null;
}

/** Foydalanuvchining kursga (hech bo'lmasa qisman) amaldagi kirish huquqi bormi. */
export async function hasAccess(userId: string, courseSlug: string): Promise<boolean> {
  return (await getActiveEnrollment(userId, courseSlug)) !== null;
}

/** Muayyan darsga kirish huquqi bormi (unlockedThrough cheklovini hisobga oladi). */
export async function canAccessLesson(
  userId: string,
  courseSlug: string,
  lessonOrder: number,
): Promise<boolean> {
  const enrollment = await getActiveEnrollment(userId, courseSlug);
  if (!enrollment) return false;
  if (enrollment.unlockedThrough !== null && lessonOrder > enrollment.unlockedThrough) return false;
  // 1-darsdan keyin faqat avvalgi dars testi 90% bilan yopilganda (yoki ustoz
  // ruxsat berganda) davom etiladi. Bu jonli guruhdagi nazorat oqimini saqlaydi.
  return lessonOrder <= 1 || isLessonCleared(userId, courseSlug, lessonOrder - 1);
}

/** To'lov/berish natijasida kirishni ochadi (Server Action / webhook ichida). */
export async function grantAccess(
  userId: string,
  courseSlug: string,
  source: EnrollmentSource,
): Promise<void> {
  const expiresAt =
    source === "monthly"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;
  const unlockedThrough = source === "installment2" ? INSTALLMENT_FIRST_UNLOCK : null;

  if (isSupabaseConfigured) {
    await grantDbAccess(userId, courseSlug, source, expiresAt, unlockedThrough);
    return;
  }
  await grantCookieAccess(userId, courseSlug, source, expiresAt, unlockedThrough);
}

/** "2 bo'lib to'lash"ning 2-to'lovi — mavjud yozilishni to'liq (cheklovsiz) kirishga ochadi. */
export async function unlockFullAccess(userId: string, courseSlug: string): Promise<void> {
  if (isSupabaseConfigured) {
    await unlockFullAccessDb(userId, courseSlug);
    return;
  }
  await unlockFullAccessCookie(userId, courseSlug);
}

/**
 * To'lov qaytarilganda (refund/cancel) kirishni qaytarib oladi — faqat real
 * rejim (webhook konteksti). "2 bo'lib to'lash"ning 2-to'lovi qaytarilsa,
 * yozilish o'chirilmaydi — qisman kirishga (1–8) qaytariladi.
 */
export async function revokeAccessForRefund(
  userId: string,
  courseSlug: string,
  opts: { relockOnly: boolean },
): Promise<void> {
  const admin = createSupabaseAdmin();
  if (!admin) return;
  const courseId = await getCourseId(courseSlug);
  if (!courseId) return;

  const query = opts.relockOnly
    ? admin
        .from("enrollments")
        .update({ unlocked_through: INSTALLMENT_FIRST_UNLOCK })
        .eq("user_id", userId)
        .eq("course_id", courseId)
    : admin.from("enrollments").delete().eq("user_id", userId).eq("course_id", courseId);

  const { error } = await query;
  if (error) console.error("[access] revokeAccessForRefund failed", error);
}

// ---- REAL rejim (Supabase) ----------------------------------------------

async function getDbEnrollments(userId: string): Promise<Enrollment[]> {
  const admin = createSupabaseAdmin();
  if (!admin) return [];
  const { data, error } = await admin
    .from("enrollments")
    .select("source, expires_at, unlocked_through, courses!inner(slug)")
    .eq("user_id", userId);
  if (error) console.error("[access] getDbEnrollments failed", error);
  if (!data) return [];
  return data.map((r) => {
    const course = r.courses as unknown as { slug: string };
    return {
      userId,
      courseSlug: course.slug,
      source: r.source as EnrollmentSource,
      expiresAt: (r.expires_at as string | null) ?? null,
      unlockedThrough: (r.unlocked_through as number | null) ?? null,
    };
  });
}

async function grantDbAccess(
  userId: string,
  courseSlug: string,
  source: EnrollmentSource,
  expiresAt: string | null,
  unlockedThrough: number | null,
): Promise<void> {
  const admin = createSupabaseAdmin();
  if (!admin) return;
  const courseId = await getCourseId(courseSlug);
  if (!courseId) return;
  const { error } = await admin
    .from("enrollments")
    .upsert(
      { user_id: userId, course_id: courseId, source, expires_at: expiresAt, unlocked_through: unlockedThrough },
      { onConflict: "user_id,course_id" },
    );
  if (error) {
    console.error("[access] grantDbAccess failed", error);
    throw new Error("Kirish huquqini berishda xatolik yuz berdi.");
  }
}

async function unlockFullAccessDb(userId: string, courseSlug: string): Promise<void> {
  const admin = createSupabaseAdmin();
  if (!admin) return;
  const courseId = await getCourseId(courseSlug);
  if (!courseId) return;
  const { error } = await admin
    .from("enrollments")
    .update({ unlocked_through: null })
    .eq("user_id", userId)
    .eq("course_id", courseId);
  if (error) {
    console.error("[access] unlockFullAccessDb failed", error);
    throw new Error("To'liq kirishni ochishda xatolik yuz berdi.");
  }
}

// ---- DEMO rejim (cookie) -------------------------------------------------

async function readCookieEnrollments(): Promise<Enrollment[]> {
  const store = await cookies();
  const raw = store.get(ENROLL_COOKIE)?.value;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Enrollment[];
  } catch {
    return [];
  }
}

async function grantCookieAccess(
  userId: string,
  courseSlug: string,
  source: EnrollmentSource,
  expiresAt: string | null,
  unlockedThrough: number | null,
): Promise<void> {
  const store = await cookies();
  const all = await readCookieEnrollments();
  // Bir kursga bitta faol yozuv — eskisini almashtiramiz.
  const filtered = all.filter((e) => !(e.userId === userId && e.courseSlug === courseSlug));
  filtered.push({ userId, courseSlug, source, expiresAt, unlockedThrough });
  store.set(ENROLL_COOKIE, JSON.stringify(filtered), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

async function unlockFullAccessCookie(userId: string, courseSlug: string): Promise<void> {
  const store = await cookies();
  const all = await readCookieEnrollments();
  const updated = all.map((e) =>
    e.userId === userId && e.courseSlug === courseSlug ? { ...e, unlockedThrough: null } : e,
  );
  store.set(ENROLL_COOKIE, JSON.stringify(updated), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
