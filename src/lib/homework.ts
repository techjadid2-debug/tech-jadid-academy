import "server-only";
import { cookies } from "next/headers";
import { generateObject, jsonSchema } from "ai";
import type { HomeworkStatus, HomeworkSubmission, Lesson } from "./types";
import { isSupabaseConfigured, isSandboxConfigured, env } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getLessonId } from "@/lib/supabase/db";
import { issueCertificateIfEligible } from "@/lib/certificates";
import type { AppUser } from "@/lib/auth";
import {
  normalizeHomeworkLink,
  validHomeworkFileMeta,
} from "@/lib/homework-files";

// ============================================================================
// Uy vazifasi — matn + fayl + havola. Topshirilganda AI darhol dastlabki
// baho+izoh beradi (agar AI Gateway sozlangan bo'lsa); ustoz keyin admin
// panelda ko'rib chiqib bahoni tahrirlaydi (statusni "reviewed" qiladi).
//
// REAL rejim: Supabase `homework_submissions` + Storage bucket `homework`.
// DEMO rejim: `tj_homework` cookie (fayl yuklash demo rejimda mavjud emas).
// ============================================================================

const COOKIE = "tj_homework";
const MAX_TEXT_CHARS = 4000;
const HOMEWORK_AI_DAILY_LIMIT = 3;

type StoredSubmission = Omit<HomeworkSubmission, "courseSlug" | "lessonOrder"> & {
  courseSlug: string;
  lessonOrder: number;
};
type StoredMap = Record<string, StoredSubmission>;

function keyOf(userId: string, slug: string, order: number) {
  return `${userId}:${slug}:${order}`;
}

export interface SubmitHomeworkInput {
  text: string;
  link: string;
  file: File | null;
  filePath?: string;
  fileName?: string;
}

const gradeResultSchema = jsonSchema<{ score: number; feedback: string }>({
  type: "object",
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    feedback: { type: "string" },
  },
  required: ["score", "feedback"],
  additionalProperties: false,
});

/** O'quvchining shu darsdagi joriy topshirig'i (bo'lmasa null). */
export async function getSubmission(userId: string, slug: string, order: number): Promise<HomeworkSubmission | null> {
  if (isSupabaseConfigured) return getDbSubmission(userId, slug, order);
  const map = await readCookieMap();
  return map[keyOf(userId, slug, order)] ?? null;
}

/** Uy vazifasini topshiradi (fayl bo'lsa yuklaydi) va AI baholaydi. */
export async function submitHomework(
  userId: string,
  slug: string,
  order: number,
  lesson: Lesson,
  moduleTitle: string,
  courseTitle: string,
  input: SubmitHomeworkInput,
): Promise<HomeworkSubmission> {
  const contentText = input.text.trim().slice(0, MAX_TEXT_CHARS) || null;
  const linkUrl = normalizeHomeworkLink(input.link);

  let filePath: string | null = null;
  let fileName: string | null = null;
  const lessonId = isSupabaseConfigured ? await getLessonId(slug, order) : null;
  const expectedPrefix = lessonId ? `${userId}/${lessonId}/` : "";
  if (input.filePath && expectedPrefix && input.filePath.startsWith(expectedPrefix)) {
    const uploaded = await validateUploadedObject(input.filePath);
    if (uploaded) {
      filePath = input.filePath.slice(0, 500);
      fileName = (input.fileName ?? "fayl").trim().slice(0, 180);
    }
  }
  if (input.file && input.file.size > 0 && isSupabaseConfigured) {
    if (!validHomeworkFileMeta({ size: input.file.size, contentType: input.file.type })) {
      throw new Error("Fayl turi yoki hajmi ruxsat etilmagan.");
    }
    const admin = createSupabaseAdmin();
    if (admin) {
      const safeName = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${lessonId ?? order}/${Date.now()}-${safeName}`;
      const { error } = await admin.storage.from("homework").upload(path, input.file, {
        contentType: input.file.type || "application/octet-stream",
        upsert: true,
      });
      if (error) console.error("[homework] file upload failed", error);
      else {
        filePath = path;
        fileName = input.file.name;
      }
    }
  }

  const canGrade = lessonId
    ? await claimHomeworkAiUsage(userId, lessonId)
    : false;
  const grade = canGrade
    ? await gradeWithAi(lesson, moduleTitle, courseTitle, { contentText, linkUrl, fileName })
    : null;
  const status: HomeworkStatus = grade ? "ai_graded" : "submitted";
  const now = new Date().toISOString();

  const submission: HomeworkSubmission = {
    id: "",
    userId,
    courseSlug: slug,
    lessonOrder: order,
    contentText,
    linkUrl,
    filePath,
    fileName,
    status,
    aiScore: grade?.score ?? null,
    aiFeedback: grade?.feedback ?? null,
    teacherScore: null,
    teacherFeedback: null,
    reviewedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured) return saveDbSubmission(userId, slug, order, submission);
  return saveCookieSubmission(userId, slug, order, submission);
}

async function claimHomeworkAiUsage(userId: string, lessonId: string): Promise<boolean> {
  if (!isSandboxConfigured) return false;
  const admin = createSupabaseAdmin();
  if (!admin) return false;
  const { data, error } = await admin.rpc("claim_homework_ai_usage", {
    p_user_id: userId,
    p_lesson_id: lessonId,
    p_daily_limit: HOMEWORK_AI_DAILY_LIMIT,
  });
  if (error) {
    console.error("[homework] AI quota claim failed", error);
    return false;
  }
  return Boolean(data);
}

async function validateUploadedObject(path: string): Promise<boolean> {
  const admin = createSupabaseAdmin();
  if (!admin) return false;
  const slash = path.lastIndexOf("/");
  if (slash < 1) return false;
  const folder = path.slice(0, slash);
  const name = path.slice(slash + 1);
  const { data, error } = await admin.storage.from("homework").list(folder, {
    search: name,
    limit: 20,
  });
  if (error) {
    console.error("[homework] uploaded file metadata failed", error);
    return false;
  }
  const object = data?.find((item) => item.name === name);
  const metadata = object?.metadata as
    | { size?: number; mimetype?: string; contentType?: string }
    | undefined;
  return validHomeworkFileMeta({
    size: Number(metadata?.size ?? 0),
    contentType: String(metadata?.mimetype ?? metadata?.contentType ?? ""),
  });
}

/** Ustozning admin panel uchun — hali ko'rib chiqilmagan (AI baholagan) topshiriqlar. */
export interface ReviewQueueItem extends HomeworkSubmission {
  studentName: string | null;
  studentLogin: string | null;
  lessonTitle: string;
}

export async function listSubmissionsForReview(slug: string, viewer?: AppUser): Promise<ReviewQueueItem[]> {
  const admin = createSupabaseAdmin();
  if (!admin) return [];

  let allowedStudentIds: string[] | null = null;
  if (viewer?.role === "instructor") {
    const { data: teaching } = await admin.from("cohort_members").select("cohort_id")
      .eq("user_id", viewer.id).eq("member_role", "instructor").neq("status", "removed");
    const cohortIds = (teaching ?? []).map((row) => row.cohort_id as string);
    if (cohortIds.length === 0) return [];
    const { data: students } = await admin.from("cohort_members").select("user_id")
      .in("cohort_id", cohortIds).eq("member_role", "student").neq("status", "removed");
    allowedStudentIds = [...new Set((students ?? []).map((row) => row.user_id as string))];
    if (allowedStudentIds.length === 0) return [];
  }

  let query = admin
    .from("homework_submissions")
    .select(
      `id, user_id, content_text, link_url, file_path, file_name, status,
       ai_score, ai_feedback, teacher_score, teacher_feedback, reviewed_at, created_at, updated_at,
       lessons!inner ( order, title, modules!inner ( courses!inner ( slug ) ) )`,
    )
    .eq("lessons.modules.courses.slug", slug)
    .in("status", ["submitted", "ai_graded", "reviewed"])
    .order("created_at", { ascending: false });
  if (allowedStudentIds) query = query.in("user_id", allowedStudentIds);
  const { data, error } = await query;
  if (error) {
    console.error("[homework] listSubmissionsForReview failed", error);
    return [];
  }
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const userIds = [...new Set(rows.map((r) => r.user_id as string))];
  const { data: profiles } = await admin.from("profiles").select("id, login, full_name").in("id", userIds);
  const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  return rows.map((r) => {
    const lessonRow = r.lessons as unknown as { order: number; title: string };
    const profile = profileById.get(r.user_id as string);
    return {
      id: r.id as string,
      userId: r.user_id as string,
      courseSlug: slug,
      lessonOrder: lessonRow.order,
      lessonTitle: lessonRow.title,
      contentText: (r.content_text as string | null) ?? null,
      linkUrl: (r.link_url as string | null) ?? null,
      filePath: (r.file_path as string | null) ?? null,
      fileName: (r.file_name as string | null) ?? null,
      status: r.status as HomeworkStatus,
      aiScore: (r.ai_score as number | null) ?? null,
      aiFeedback: (r.ai_feedback as string | null) ?? null,
      teacherScore: (r.teacher_score as number | null) ?? null,
      teacherFeedback: (r.teacher_feedback as string | null) ?? null,
      reviewedAt: (r.reviewed_at as string | null) ?? null,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
      studentName: (profile?.full_name as string | undefined) ?? null,
      studentLogin: (profile?.login as string | undefined) ?? null,
    };
  });
}

/** Ustoz bahoni tahrirlaydi/tasdiqlaydi. */
export async function reviewSubmission(
  submissionId: string,
  reviewerId: string,
  score: number,
  feedback: string,
): Promise<boolean> {
  const admin = createSupabaseAdmin();
  if (!admin) return false;
  const { data: target } = await admin
    .from("homework_submissions")
    .select("user_id, lessons ( order, modules ( courses ( slug ) ) )")
    .eq("id", submissionId)
    .maybeSingle();
  const { error } = await admin
    .from("homework_submissions")
    .update({
      teacher_score: Math.max(0, Math.min(100, Math.round(score))),
      teacher_feedback: feedback.trim().slice(0, MAX_TEXT_CHARS),
      status: "reviewed",
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);
  if (error) {
    console.error("[homework] reviewSubmission failed", error);
    return false;
  }
  const lesson = target?.lessons as unknown as { order: number; modules: { courses: { slug: string } } } | null;
  if (target && lesson?.order === 16 && score >= 80) {
    await issueCertificateIfEligible(target.user_id as string, lesson.modules.courses.slug);
  }
  return true;
}

/** Fayl uchun vaqtinchalik (imzolangan) ko'rish havolasi. */
export async function getHomeworkFileUrl(filePath: string): Promise<string | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin.storage.from("homework").createSignedUrl(filePath, 60 * 10);
  if (error) {
    console.error("[homework] getHomeworkFileUrl failed", error);
    return null;
  }
  return data?.signedUrl ?? null;
}

// ---- AI baholash ------------------------------------------------------------

async function gradeWithAi(
  lesson: Lesson,
  moduleTitle: string,
  courseTitle: string,
  submission: { contentText: string | null; linkUrl: string | null; fileName: string | null },
): Promise<{ score: number; feedback: string } | null> {
  if (!isSandboxConfigured) return null;
  if (!submission.contentText && !submission.linkUrl && !submission.fileName) return null;

  const task = lesson.content?.find((b) => b.type === "task");
  const taskText = task && task.type === "task" ? `${task.title}: ${task.text}` : lesson.title;
  const checklist = task && task.type === "task" ? task.checklist : [];

  const prompt = [
    `Dars: "${lesson.title}" (modul: "${moduleTitle}", kurs: "${courseTitle}")`,
    `Topshiriq: ${taskText}`,
    checklist.length > 0 ? `Tekshiruv ro'yxati:\n${checklist.map((c) => `- ${c}`).join("\n")}` : "",
    `O'quvchi javobi (matn): ${submission.contentText ?? "(matn yo'q)"}`,
    submission.linkUrl ? `Havola: ${submission.linkUrl}` : "",
    submission.fileName ? `Ilova qilingan fayl: ${submission.fileName}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const { object } = await generateObject({
      model: env.sandboxModel,
      schema: gradeResultSchema,
      system:
        "Sen Tech Jadid akademiyasining yordamchi ustozisan. O'quvchi topshirgan uy vazifasini tekshiruv ro'yxati " +
        "asosida baholaysan. Bu DASTLABKI (AI) baho — ustoz keyin ko'rib chiqib o'zgartiradi, shuning uchun adolatli " +
        "va tushunarli bo'l. 0-100 ball ber (100 = barcha shartlar bajarilgan). Izohni o'zbek tilida, 2-4 gapda, " +
        "aniq va konstruktiv qilib yoz — nima yaxshi bajarilgan va nimani yaxshilash mumkinligini ko'rsat.",
      prompt,
      maxOutputTokens: 500,
    });
    return { score: Math.max(0, Math.min(100, Math.round(object.score))), feedback: object.feedback };
  } catch (e) {
    console.error("[homework] AI grading failed", e);
    return null;
  }
}

// ---- REAL rejim (Supabase) ---------------------------------------------------

async function getDbSubmission(userId: string, slug: string, order: number): Promise<HomeworkSubmission | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const lessonId = await getLessonId(slug, order);
  if (!lessonId) return null;
  const { data, error } = await admin
    .from("homework_submissions")
    .select(
      "id, content_text, link_url, file_path, file_name, status, ai_score, ai_feedback, teacher_score, teacher_feedback, reviewed_at, created_at, updated_at",
    )
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error) console.error("[homework] getDbSubmission failed", error);
  if (!data) return null;
  return rowToSubmission(data, userId, slug, order);
}

function rowToSubmission(
  data: Record<string, unknown>,
  userId: string,
  slug: string,
  order: number,
): HomeworkSubmission {
  return {
    id: data.id as string,
    userId,
    courseSlug: slug,
    lessonOrder: order,
    contentText: (data.content_text as string | null) ?? null,
    linkUrl: (data.link_url as string | null) ?? null,
    filePath: (data.file_path as string | null) ?? null,
    fileName: (data.file_name as string | null) ?? null,
    status: data.status as HomeworkStatus,
    aiScore: (data.ai_score as number | null) ?? null,
    aiFeedback: (data.ai_feedback as string | null) ?? null,
    teacherScore: (data.teacher_score as number | null) ?? null,
    teacherFeedback: (data.teacher_feedback as string | null) ?? null,
    reviewedAt: (data.reviewed_at as string | null) ?? null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

async function saveDbSubmission(
  userId: string,
  slug: string,
  order: number,
  submission: HomeworkSubmission,
): Promise<HomeworkSubmission> {
  const admin = createSupabaseAdmin();
  if (!admin) return submission;
  const lessonId = await getLessonId(slug, order);
  if (!lessonId) return submission;

  const { data, error } = await admin
    .from("homework_submissions")
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        content_text: submission.contentText,
        link_url: submission.linkUrl,
        file_path: submission.filePath,
        file_name: submission.fileName,
        status: submission.status,
        ai_score: submission.aiScore,
        ai_feedback: submission.aiFeedback,
        ai_model: submission.aiScore !== null ? env.sandboxModel : null,
        // Qayta topshirilganda avvalgi ustoz bahosi tozalanadi — yangi javob qayta ko'rib chiqilishi kerak.
        teacher_score: null,
        teacher_feedback: null,
        reviewed_by: null,
        reviewed_at: null,
        updated_at: submission.updatedAt,
      },
      { onConflict: "user_id,lesson_id" },
    )
    .select("id")
    .single();
  if (error) {
    console.error("[homework] saveDbSubmission failed", error);
    return submission;
  }
  return { ...submission, id: data.id as string };
}

// ---- DEMO rejim (cookie) ------------------------------------------------------

async function readCookieMap(): Promise<StoredMap> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as StoredMap;
  } catch {
    return {};
  }
}

async function saveCookieSubmission(
  userId: string,
  slug: string,
  order: number,
  submission: HomeworkSubmission,
): Promise<HomeworkSubmission> {
  const store = await cookies();
  const map = await readCookieMap();
  const withId = { ...submission, id: submission.id || keyOf(userId, slug, order) };
  map[keyOf(userId, slug, order)] = withId;
  store.set(COOKIE, JSON.stringify(map), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return withId;
}
