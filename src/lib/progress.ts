import "server-only";
import { cookies } from "next/headers";
import type { Course } from "./types";
import { allLessons } from "./course-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getLessonId } from "@/lib/supabase/db";

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
  const { error } = await admin.from("lesson_progress").upsert(
    { user_id: userId, lesson_id: lessonId, completed: done, updated_at: new Date().toISOString() },
    { onConflict: "user_id,lesson_id" },
  );
  if (error) console.error("[progress] setDbCompleted failed", error);
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
