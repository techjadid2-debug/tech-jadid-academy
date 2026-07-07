import "server-only";
import { cookies } from "next/headers";
import type { Enrollment, EnrollmentSource } from "./types";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCourseId } from "@/lib/supabase/db";

// ============================================================================
// Kirish nazorati (enrollment) — dual-mode.
//
// REAL rejim: Supabase `enrollments` jadvali (o'qish RLS, yozish service role).
// DEMO rejim: `tj_enroll` cookie'da JSON ro'yxat.
// ============================================================================

const ENROLL_COOKIE = "tj_enroll";

export async function getEnrollments(userId: string): Promise<Enrollment[]> {
  if (isSupabaseConfigured) return getDbEnrollments(userId);
  const all = await readCookieEnrollments();
  return all.filter((e) => e.userId === userId);
}

/** Foydalanuvchining kursga amaldagi kirish huquqi bormi. */
export async function hasAccess(userId: string, courseSlug: string): Promise<boolean> {
  const list = await getEnrollments(userId);
  const now = Date.now();
  return list.some(
    (e) =>
      e.courseSlug === courseSlug &&
      (e.expiresAt === null || new Date(e.expiresAt).getTime() > now),
  );
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

  if (isSupabaseConfigured) {
    await grantDbAccess(userId, courseSlug, source, expiresAt);
    return;
  }
  await grantCookieAccess(userId, courseSlug, source, expiresAt);
}

// ---- REAL rejim (Supabase) ----------------------------------------------

async function getDbEnrollments(userId: string): Promise<Enrollment[]> {
  const admin = createSupabaseAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("enrollments")
    .select("source, expires_at, courses!inner(slug)")
    .eq("user_id", userId);
  if (!data) return [];
  return data.map((r) => {
    const course = r.courses as unknown as { slug: string };
    return {
      userId,
      courseSlug: course.slug,
      source: r.source as EnrollmentSource,
      expiresAt: (r.expires_at as string | null) ?? null,
    };
  });
}

async function grantDbAccess(
  userId: string,
  courseSlug: string,
  source: EnrollmentSource,
  expiresAt: string | null,
): Promise<void> {
  const admin = createSupabaseAdmin();
  if (!admin) return;
  const courseId = await getCourseId(courseSlug);
  if (!courseId) return;
  await admin
    .from("enrollments")
    .upsert(
      { user_id: userId, course_id: courseId, source, expires_at: expiresAt },
      { onConflict: "user_id,course_id" },
    );
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
): Promise<void> {
  const store = await cookies();
  const all = await readCookieEnrollments();
  // Bir kursga bitta faol yozuv — eskisini almashtiramiz.
  const filtered = all.filter((e) => !(e.userId === userId && e.courseSlug === courseSlug));
  filtered.push({ userId, courseSlug, source, expiresAt });
  store.set(ENROLL_COOKIE, JSON.stringify(filtered), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
