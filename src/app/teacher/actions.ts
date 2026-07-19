"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, normalizeLogin } from "@/lib/auth";
import { isTeacher } from "@/lib/cohorts";
import { AI_FOUNDATIONS } from "@/lib/course-data";
import { createPaymentForRequest, getPaymentByOrderId, markPaymentPaid } from "@/lib/payments/db";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCourseId } from "@/lib/supabase/db";
import type { PricingKind } from "@/lib/types";
import { buildCohortSchedule } from "@/lib/cohort-schedule";
import { isCheckoutConfigured } from "@/lib/env";

async function requireTeacherDb(cohortId?: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/teacher");
  if (!isTeacher(user)) redirect("/dashboard");
  const admin = createSupabaseAdmin();
  if (!admin) redirect("/teacher?error=no-service-key");
  if (cohortId && user.role === "instructor") {
    const { data } = await admin.from("cohort_members").select("cohort_id")
      .eq("cohort_id", cohortId).eq("user_id", user.id).eq("member_role", "instructor")
      .neq("status", "removed").maybeSingle();
    if (!data) redirect("/teacher?error=forbidden");
  }
  return { user, admin };
}

function safeUrl(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function validDate(value: FormDataEntryValue | null): Date | null {
  const raw = String(value ?? "").trim();
  const zoned = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw) ? `${raw}:00+05:00` : raw;
  const date = new Date(zoned);
  return Number.isFinite(date.getTime()) ? date : null;
}

/** 8 haftalik, haftasiga ikki darslik cohort va uning to'liq jadvalini yaratadi. */
export async function createCohort(formData: FormData) {
  const { user, admin } = await requireTeacherDb();
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const firstSession = validDate(formData.get("startsAt"));
  const telegramUrl = safeUrl(formData.get("telegramUrl"));
  if (!title || !firstSession) redirect("/teacher?error=invalid");

  const courseId = await getCourseId(AI_FOUNDATIONS.slug);
  if (!courseId) redirect("/teacher?error=course");
  const endsAt = new Date(firstSession.getTime() + 8 * 7 * 24 * 60 * 60 * 1000);
  const { data: cohort, error } = await admin.from("cohorts").insert({
    course_id: courseId,
    title,
    starts_at: firstSession.toISOString(),
    ends_at: endsAt.toISOString(),
    timezone: "Asia/Tashkent",
    status: "open",
    telegram_url: telegramUrl,
    created_by: user.id,
  }).select("id").single();
  if (error || !cohort) {
    console.error("[teacher] create cohort failed", error);
    redirect("/teacher?error=save");
  }

  await admin.from("cohort_members").upsert({
    cohort_id: cohort.id,
    user_id: user.id,
    member_role: "instructor",
    status: "active",
    joined_at: new Date().toISOString(),
  }, { onConflict: "cohort_id,user_id" });

  const { data: modules } = await admin.from("modules").select("id").eq("course_id", courseId);
  const moduleIds = (modules ?? []).map((module) => module.id as string);
  const { data: lessons } = moduleIds.length
    ? await admin.from("lessons").select("id, order, title").in("module_id", moduleIds).order("order")
    : { data: [] as { id: string; order: number; title: string }[] };

  const lessonRows = buildCohortSchedule(firstSession, (lessons ?? []).map((lesson) => ({
    id: lesson.id as string,
    order: Number(lesson.order),
    title: lesson.title as string,
  })));
  if (lessonRows.length) {
    const { error: scheduleError } = await admin.from("cohort_lessons").insert(lessonRows.map((row) => ({
      cohort_id: cohort.id,
      lesson_id: row.lesson.id,
      release_at: row.releaseAt.toISOString(),
      due_at: row.dueAt.toISOString(),
    })));
    const { error: sessionError } = await admin.from("live_sessions").insert(lessonRows.map((row) => ({
      cohort_id: cohort.id,
      lesson_id: row.lesson.id,
      title: `${String(row.lesson.order).padStart(2, "0")}-dars · ${row.lesson.title}`,
      starts_at: row.sessionStarts.toISOString(),
      ends_at: row.sessionEnds.toISOString(),
      status: "scheduled",
    })));
    if (scheduleError || sessionError) {
      console.error("[teacher] initial schedule failed", scheduleError ?? sessionError);
      await admin.from("cohorts").delete().eq("id", cohort.id);
      redirect("/teacher?error=schedule");
    }
  }

  redirect(`/teacher/${cohort.id}?saved=created`);
}

export async function updateCohortLesson(formData: FormData) {
  const cohortId = String(formData.get("cohortId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const releaseAt = validDate(formData.get("releaseAt"));
  const dueAt = validDate(formData.get("dueAt"));
  const sessionStartsAt = validDate(formData.get("sessionStartsAt"));
  const meetUrl = safeUrl(formData.get("meetUrl"));
  const youtubeIdRaw = String(formData.get("youtubeId") ?? "").trim();
  const youtubeId = /^[a-zA-Z0-9_-]{6,20}$/.test(youtubeIdRaw) ? youtubeIdRaw : null;
  if (!cohortId || !lessonId || !releaseAt || !sessionStartsAt || (dueAt && dueAt < releaseAt)) {
    redirect(`/teacher/${cohortId}?error=invalid#lesson-${lessonId}`);
  }
  const { admin } = await requireTeacherDb(cohortId);
  const { data: scheduled } = await admin.from("cohort_lessons").select("lesson_id")
    .eq("cohort_id", cohortId).eq("lesson_id", lessonId).maybeSingle();
  if (!scheduled) redirect(`/teacher/${cohortId}?error=invalid`);

  const sessionEndsAt = new Date(sessionStartsAt.getTime() + 90 * 60 * 1000);
  const [{ error: lessonError }, { error: sessionError }] = await Promise.all([
    admin.from("cohort_lessons").update({
      release_at: releaseAt.toISOString(),
      due_at: dueAt?.toISOString() ?? null,
      updated_at: new Date().toISOString(),
    }).eq("cohort_id", cohortId).eq("lesson_id", lessonId),
    admin.from("live_sessions").update({
      starts_at: sessionStartsAt.toISOString(),
      ends_at: sessionEndsAt.toISOString(),
      meet_url: meetUrl,
      youtube_id: youtubeId,
      status: youtubeId ? "completed" : "scheduled",
      updated_at: new Date().toISOString(),
    }).eq("cohort_id", cohortId).eq("lesson_id", lessonId),
  ]);
  if (lessonError || sessionError) redirect(`/teacher/${cohortId}?error=save#lesson-${lessonId}`);
  revalidatePath(`/teacher/${cohortId}`);
  revalidatePath("/dashboard");
  redirect(`/teacher/${cohortId}?saved=lesson#lesson-${lessonId}`);
}

export async function publishAnnouncement(formData: FormData) {
  const cohortId = String(formData.get("cohortId") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 140);
  const body = String(formData.get("body") ?? "").trim().slice(0, 4000);
  if (!cohortId || !title || !body) redirect(`/teacher/${cohortId}?error=invalid#announcements`);
  const { user, admin } = await requireTeacherDb(cohortId);
  const { error } = await admin.from("announcements").insert({ cohort_id: cohortId, author_id: user.id, title, body });
  if (error) redirect(`/teacher/${cohortId}?error=save#announcements`);
  revalidatePath(`/teacher/${cohortId}`);
  revalidatePath("/dashboard");
  redirect(`/teacher/${cohortId}?saved=announcement#announcements`);
}

export async function prepareApplicationPayment(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");
  const cohortId = String(formData.get("cohortId") ?? "");
  const rawKind = String(formData.get("kind") ?? "lifetime") as PricingKind;
  const kind = rawKind === "monthly" ? "monthly" : "lifetime";
  if (!requestId || !cohortId) redirect("/teacher?error=invalid#applications");
  await requireTeacherDb(cohortId);
  if (!isCheckoutConfigured) redirect("/teacher?error=payment-config#applications");
  const paymentId = await createPaymentForRequest(requestId, cohortId, kind);
  if (!paymentId) redirect("/teacher?error=payment#applications");
  revalidatePath("/teacher");
  revalidatePath("/dashboard");
  redirect(`/teacher?saved=payment&order=${paymentId}#applications`);
}

/** Telegram bot ishlatilmasa, ustoz chekni qo'lda tekshirib payment'ni tasdiqlaydi. */
export async function approveManualPayment(formData: FormData) {
  const paymentId = String(formData.get("paymentId") ?? "");
  if (!paymentId) redirect("/teacher?error=invalid#applications");
  const payment = await getPaymentByOrderId(paymentId);
  if (!payment?.cohortId || payment.status !== "pending") redirect("/teacher?error=payment#applications");
  const { user } = await requireTeacherDb(payment.cohortId);
  await markPaymentPaid(payment, { raw: { ...payment.raw, manual: { approved_in_teacher: true, approved_by: user.id, approved_at: new Date().toISOString() } } });
  revalidatePath("/teacher");
  revalidatePath("/dashboard");
  redirect("/teacher?saved=paid#applications");
}

export async function updateCohortStatus(formData: FormData) {
  const cohortId = String(formData.get("cohortId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!cohortId || !["draft", "open", "active", "completed"].includes(status)) redirect("/teacher?error=invalid");
  const { admin } = await requireTeacherDb(cohortId);
  const { error } = await admin.from("cohorts").update({ status, updated_at: new Date().toISOString() }).eq("id", cohortId);
  if (error) redirect(`/teacher/${cohortId}?error=save`);
  revalidatePath("/teacher");
  revalidatePath(`/teacher/${cohortId}`);
  redirect(`/teacher/${cohortId}?saved=status`);
}

export async function addInstructorToCohort(formData: FormData) {
  const cohortId = String(formData.get("cohortId") ?? "");
  const login = normalizeLogin(String(formData.get("login") ?? ""));
  if (!cohortId || !login) redirect(`/teacher/${cohortId}?error=invalid#instructors`);
  const { admin } = await requireTeacherDb(cohortId);
  const { data: profile } = await admin.from("profiles").select("id, role").eq("login", login).maybeSingle();
  if (!profile || !["instructor", "admin"].includes(profile.role as string)) redirect(`/teacher/${cohortId}?error=instructor#instructors`);
  const { error } = await admin.from("cohort_members").upsert({
    cohort_id: cohortId,
    user_id: profile.id,
    member_role: "instructor",
    status: "active",
    joined_at: new Date().toISOString(),
  }, { onConflict: "cohort_id,user_id" });
  if (error) redirect(`/teacher/${cohortId}?error=save#instructors`);
  revalidatePath(`/teacher/${cohortId}`);
  redirect(`/teacher/${cohortId}?saved=instructor#instructors`);
}

export async function markAttendance(formData: FormData) {
  const cohortId = String(formData.get("cohortId") ?? "");
  const sessionId = String(formData.get("sessionId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!cohortId || !sessionId || !studentId || !["present", "late", "absent", "excused"].includes(status)) {
    redirect(`/teacher/${cohortId}?error=invalid#students`);
  }
  const { user, admin } = await requireTeacherDb(cohortId);
  const [{ data: session }, { data: member }] = await Promise.all([
    admin.from("live_sessions").select("id").eq("id", sessionId).eq("cohort_id", cohortId).maybeSingle(),
    admin.from("cohort_members").select("user_id").eq("cohort_id", cohortId).eq("user_id", studentId).eq("member_role", "student").maybeSingle(),
  ]);
  if (!session || !member) redirect(`/teacher/${cohortId}?error=invalid#students`);
  const { error } = await admin.from("attendance").upsert({
    session_id: sessionId, user_id: studentId, status, marked_by: user.id, marked_at: new Date().toISOString(),
  }, { onConflict: "session_id,user_id" });
  if (error) redirect(`/teacher/${cohortId}?error=save#students`);
  redirect(`/teacher/${cohortId}?saved=attendance#students`);
}
