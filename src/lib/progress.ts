import "server-only";
import { cookies } from "next/headers";
import type { Course } from "./types";
import { allLessons } from "./course-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getLessonId } from "@/lib/supabase/db";
import { getCourseAsync } from "@/lib/course";
import { awardBadge, recordActivity } from "@/lib/gamification";
import { issueCertificateIfEligible } from "@/lib/certificates";

// ============================================================================
// Dars progressi — dual-mode.
//
// REAL rejim: Supabase `lesson_progress` jadvali (global dars "order" ↔ uuid).
// DEMO rejim: `tj_progress` cookie — { "<userId>:<slug>": number[] }.
// ============================================================================

const PROGRESS_COOKIE = "tj_progress";

type ProgressMap = Record<string, number[]>;

function keyOf(userId: string, slug: string) {
  return `${userId}:${slug}`;
}

export async function getCompleted(userId: string, slug: string): Promise<number[]> {
  if (isSupabaseConfigured) return getDbCompleted(userId, slug);
  const map = await readCookieMap();
  return map[keyOf(userId, slug)] ?? [];
}

export async function isCompleted(userId: string, slug: string, order: number): Promise<boolean> {
  const list = await getCompleted(userId, slug);
  return list.includes(order);
}

/** Darsni yakunlangan/yakunlanmagan qilib belgilaydi (Server Action ichida). */
export async function setCompleted(
  userId: string,
  slug: string,
  order: number,
  done: boolean,
): Promise<void> {
  if (isSupabaseConfigured) {
    await setDbCompleted(userId, slug, order, done);
    return;
  }
  await setCookieCompleted(userId, slug, order, done);
}

/** Kurs bo'yicha foizni hisoblaydi. */
export function percentOf(course: Course, completed: number[]): number {
  const total = allLessons(course).length;
  if (total === 0) return 0;
  return Math.round((completed.length / total) * 100);
}

// ---- REAL rejim (Supabase) ----------------------------------------------

async function getDbCompleted(userId: string, slug: string): Promise<number[]> {
  const admin = createSupabaseAdmin();
  if (!admin) return [];
  const { data, error } = await admin
    .from("lesson_progress")
    .select("lessons!inner(order, modules!inner(courses!inner(slug)))")
    .eq("user_id", userId)
    .eq("completed", true)
    .eq("lessons.modules.courses.slug", slug);
  if (error) console.error("[progress] getDbCompleted failed", error);
  if (!data) return [];
  return data
    .map((r) => (r.lessons as unknown as { order: number }).order)
    .sort((a, b) => a - b);
}

async function setDbCompleted(
  userId: string,
  slug: string,
  order: number,
  done: boolean,
): Promise<void> {
  const admin = createSupabaseAdmin();
  if (!admin) return;
  const lessonId = await getLessonId(slug, order);
  if (!lessonId) return;

  // DB RPC row-lock + immutable first_completed_at bilan race-safe claim qiladi.
  const { data: firstCompletion, error } = await admin.rpc("set_lesson_progress_claim", {
    p_user_id: userId,
    p_lesson_id: lessonId,
    p_completed: done,
  });
  if (error) {
    console.error("[progress] setDbCompleted failed", error);
    return;
  }

  if (done) {
    await onLessonProgressChanged(userId, slug, firstCompletion === true);
  }
}

/** Gamifikatsiya hook'i: first event ball beradi, lekin har safar course/cert reconciliation qiladi. */
async function onLessonProgressChanged(userId: string, slug: string, firstCompletion: boolean): Promise<void> {
  try {
    if (firstCompletion) {
      await recordActivity(userId, { lessonsCompleted: 1, points: 10 });
      await awardBadge(userId, "first-lesson");
    }

    const course = await getCourseAsync(slug);
    if (!course) return;
    const completed = await getDbCompleted(userId, slug);

    const module1 = course.modules.find((m) => m.order === 1);
    if (module1 && module1.lessons.every((l) => completed.includes(l.order))) {
      await awardBadge(userId, "module-1");
    }

    if (percentOf(course, completed) === 100) {
      const newlyAwarded = await awardBadge(userId, "course-100");
      if (newlyAwarded) await recordActivity(userId, { points: 50 }); // kurs bonus — bir marta
      await issueCertificateIfEligible(userId, slug);
    }
  } catch (e) {
    // Gamifikatsiya xatosi dars belgilashni to'xtatmasin.
    console.error("[progress] gamification hook failed", e);
  }
}

// ---- DEMO rejim (cookie) -------------------------------------------------

async function readCookieMap(): Promise<ProgressMap> {
  const store = await cookies();
  const raw = store.get(PROGRESS_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

async function setCookieCompleted(
  userId: string,
  slug: string,
  order: number,
  done: boolean,
): Promise<void> {
  const store = await cookies();
  const map = await readCookieMap();
  const k = keyOf(userId, slug);
  const set = new Set(map[k] ?? []);
  if (done) set.add(order);
  else set.delete(order);
  map[k] = Array.from(set).sort((a, b) => a - b);
  store.set(PROGRESS_COOKIE, JSON.stringify(map), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
