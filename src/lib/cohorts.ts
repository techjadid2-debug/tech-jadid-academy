import "server-only";

import { cache } from "react";
import type { AppUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCourseId } from "@/lib/supabase/db";

export type CohortStatus = "draft" | "open" | "active" | "completed";
export type AttendanceStatus = "present" | "late" | "absent" | "excused";

export interface CohortSummary {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: CohortStatus;
  telegramUrl: string | null;
  studentCount: number;
}

export interface CohortLessonSchedule {
  lessonId: string;
  order: number;
  title: string;
  releaseAt: string;
  dueAt: string | null;
  sessionId: string | null;
  sessionStartsAt: string | null;
  sessionEndsAt: string | null;
  meetUrl: string | null;
  youtubeId: string | null;
  sessionStatus: string | null;
}

export interface CohortAnnouncement {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
}

export interface CohortMemberView {
  userId: string;
  fullName: string;
  login: string | null;
  phone: string | null;
  role: "student" | "instructor";
  status: string;
  joinedAt: string | null;
  completedLessons: number;
  quizPercent: number;
}

export interface CohortWorkspace {
  cohort: CohortSummary;
  lessons: CohortLessonSchedule[];
  announcements: CohortAnnouncement[];
  members: CohortMemberView[];
}

export interface StudentCohortContext {
  cohort: CohortSummary;
  lessons: CohortLessonSchedule[];
  announcements: CohortAnnouncement[];
  nextSession: CohortLessonSchedule | null;
}

export function isTeacher(user: AppUser): boolean {
  return user.role === "admin" || user.role === "instructor";
}

/** Ustoz ko'ra oladigan guruhlar. Admin barcha guruhlarni, instructor faqat o'zinikini ko'radi. */
export async function listTeacherCohorts(user: AppUser, courseSlug: string): Promise<CohortSummary[]> {
  const admin = createSupabaseAdmin();
  const courseId = await getCourseId(courseSlug);
  if (!admin || !courseId || !isTeacher(user)) return [];

  let allowedIds: string[] | null = null;
  if (user.role === "instructor") {
    const { data: memberships } = await admin
      .from("cohort_members")
      .select("cohort_id")
      .eq("user_id", user.id)
      .eq("member_role", "instructor")
      .neq("status", "removed");
    allowedIds = (memberships ?? []).map((row) => row.cohort_id as string);
    if (allowedIds.length === 0) return [];
  }

  let query = admin
    .from("cohorts")
    .select("id, title, starts_at, ends_at, timezone, status, telegram_url")
    .eq("course_id", courseId)
    .order("starts_at", { ascending: false });
  if (allowedIds) query = query.in("id", allowedIds);

  const { data, error } = await query;
  if (error) {
    console.error("[cohorts] listTeacherCohorts failed", error);
    return [];
  }
  return Promise.all((data ?? []).map(async (row) => {
    const { count } = await admin
      .from("cohort_members")
      .select("*", { head: true, count: "exact" })
      .eq("cohort_id", row.id)
      .eq("member_role", "student")
      .eq("status", "active");
    return mapCohort(row, count ?? 0);
  }));
}

/** O'quvchining shu kursdagi faol guruh konteksti. */
export const getStudentCohortContext = cache(async (userId: string, courseSlug: string): Promise<StudentCohortContext | null> => {
  const admin = createSupabaseAdmin();
  const courseId = await getCourseId(courseSlug);
  if (!admin || !courseId) return null;

  const { data: memberships, error } = await admin
    .from("cohort_members")
    .select("cohort_id")
    .eq("user_id", userId)
    .eq("member_role", "student")
    .eq("status", "active");
  if (error || !memberships?.length) return null;

  const cohortIds = memberships.map((row) => row.cohort_id as string);
  const { data: cohort } = await admin
    .from("cohorts")
    .select("id, title, starts_at, ends_at, timezone, status, telegram_url")
    .in("id", cohortIds)
    .eq("course_id", courseId)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!cohort) return null;

  const lessons = await getSchedule(cohort.id as string);
  const announcements = await getAnnouncements(cohort.id as string);
  const now = Date.now();
  const nextSession = lessons
    .filter((lesson) => lesson.sessionStartsAt && new Date(lesson.sessionStartsAt).getTime() >= now)
    .sort((a, b) => new Date(a.sessionStartsAt!).getTime() - new Date(b.sessionStartsAt!).getTime())[0] ?? null;

  return {
    cohort: mapCohort(cohort, 0),
    lessons,
    announcements,
    nextSession,
  };
});

/** Jadval bo'yicha dars ochilganligini aytadi. null — foydalanuvchida cohort yo'q. */
export async function isCohortLessonReleased(
  userId: string,
  courseSlug: string,
  lessonOrder: number,
): Promise<boolean | null> {
  const context = await getStudentCohortContext(userId, courseSlug);
  if (!context) return null;
  const scheduled = context.lessons.find((lesson) => lesson.order === lessonOrder);
  return Boolean(scheduled && new Date(scheduled.releaseAt).getTime() <= Date.now());
}

export async function getCohortWorkspace(user: AppUser, cohortId: string): Promise<CohortWorkspace | null> {
  const admin = createSupabaseAdmin();
  if (!admin || !isTeacher(user)) return null;
  if (user.role === "instructor") {
    const { data: membership } = await admin
      .from("cohort_members")
      .select("cohort_id")
      .eq("cohort_id", cohortId)
      .eq("user_id", user.id)
      .eq("member_role", "instructor")
      .neq("status", "removed")
      .maybeSingle();
    if (!membership) return null;
  }

  const { data: cohort } = await admin
    .from("cohorts")
    .select("id, title, starts_at, ends_at, timezone, status, telegram_url")
    .eq("id", cohortId)
    .maybeSingle();
  if (!cohort) return null;

  const [{ count }, lessons, announcements, members] = await Promise.all([
    admin.from("cohort_members").select("*", { head: true, count: "exact" })
      .eq("cohort_id", cohortId).eq("member_role", "student").eq("status", "active"),
    getSchedule(cohortId),
    getAnnouncements(cohortId),
    getMembers(cohortId),
  ]);
  return { cohort: mapCohort(cohort, count ?? 0), lessons, announcements, members };
}

async function getSchedule(cohortId: string): Promise<CohortLessonSchedule[]> {
  const admin = createSupabaseAdmin();
  if (!admin) return [];
  const { data, error } = await admin
    .from("cohort_lessons")
    .select("lesson_id, release_at, due_at, lessons ( order, title )")
    .eq("cohort_id", cohortId);
  if (error) {
    console.error("[cohorts] schedule failed", error);
    return [];
  }
  const { data: sessions } = await admin
    .from("live_sessions")
    .select("id, lesson_id, starts_at, ends_at, meet_url, youtube_id, status")
    .eq("cohort_id", cohortId);
  const sessionByLesson = new Map((sessions ?? []).map((session) => [session.lesson_id as string, session]));
  return (data ?? []).map((row) => {
    const lesson = row.lessons as unknown as { order: number; title: string };
    const session = sessionByLesson.get(row.lesson_id as string);
    return {
      lessonId: row.lesson_id as string,
      order: lesson.order,
      title: lesson.title,
      releaseAt: row.release_at as string,
      dueAt: (row.due_at as string | null) ?? null,
      sessionId: (session?.id as string | undefined) ?? null,
      sessionStartsAt: (session?.starts_at as string | undefined) ?? null,
      sessionEndsAt: (session?.ends_at as string | undefined) ?? null,
      meetUrl: (session?.meet_url as string | null | undefined) ?? null,
      youtubeId: (session?.youtube_id as string | null | undefined) ?? null,
      sessionStatus: (session?.status as string | undefined) ?? null,
    };
  }).sort((a, b) => a.order - b.order);
}

async function getAnnouncements(cohortId: string): Promise<CohortAnnouncement[]> {
  const admin = createSupabaseAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("announcements")
    .select("id, title, body, published_at")
    .eq("cohort_id", cohortId)
    .order("published_at", { ascending: false })
    .limit(10);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    body: row.body as string,
    publishedAt: row.published_at as string,
  }));
}

async function getMembers(cohortId: string): Promise<CohortMemberView[]> {
  const admin = createSupabaseAdmin();
  if (!admin) return [];
  const { data } = await admin
    .from("cohort_members")
    .select("user_id, member_role, status, joined_at")
    .eq("cohort_id", cohortId)
    .neq("status", "removed")
    .order("created_at");
  const ids = (data ?? []).map((row) => row.user_id as string);
  if (ids.length === 0) return [];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, login, phone")
    .in("id", ids);
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id as string, profile]));
  const { data: cohortLessons } = await admin.from("cohort_lessons").select("lesson_id").eq("cohort_id", cohortId);
  const lessonIds = (cohortLessons ?? []).map((row) => row.lesson_id as string);
  const { data: questions } = lessonIds.length
    ? await admin.from("quiz_questions").select("id").in("lesson_id", lessonIds)
    : { data: [] as { id: string }[] };
  const questionIds = (questions ?? []).map((row) => row.id as string);
  const [{ data: progress }, { data: answers }] = await Promise.all([
    lessonIds.length ? admin.from("lesson_progress").select("user_id").in("user_id", ids).in("lesson_id", lessonIds).eq("completed", true) : Promise.resolve({ data: [] }),
    questionIds.length ? admin.from("quiz_answers").select("user_id").in("user_id", ids).in("question_id", questionIds).eq("is_correct", true) : Promise.resolve({ data: [] }),
  ]);
  const completedByUser = new Map<string, number>();
  for (const row of progress ?? []) completedByUser.set(row.user_id as string, (completedByUser.get(row.user_id as string) ?? 0) + 1);
  const correctByUser = new Map<string, number>();
  for (const row of answers ?? []) correctByUser.set(row.user_id as string, (correctByUser.get(row.user_id as string) ?? 0) + 1);
  return (data ?? []).map((row) => {
    const profile = profileById.get(row.user_id as string);
    return {
      userId: row.user_id as string,
      fullName: (profile?.full_name as string | undefined) ?? "Noma'lum",
      login: (profile?.login as string | null | undefined) ?? null,
      phone: (profile?.phone as string | null | undefined) ?? null,
      role: row.member_role as "student" | "instructor",
      status: row.status as string,
      joinedAt: (row.joined_at as string | null) ?? null,
      completedLessons: completedByUser.get(row.user_id as string) ?? 0,
      quizPercent: questionIds.length ? Math.round(((correctByUser.get(row.user_id as string) ?? 0) / questionIds.length) * 100) : 0,
    };
  });
}

function mapCohort(row: Record<string, unknown>, studentCount: number): CohortSummary {
  return {
    id: row.id as string,
    title: row.title as string,
    startsAt: row.starts_at as string,
    endsAt: row.ends_at as string,
    timezone: row.timezone as string,
    status: row.status as CohortStatus,
    telegramUrl: (row.telegram_url as string | null) ?? null,
    studentCount,
  };
}
