"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { emailForLogin, normalizeLogin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCourseAsync } from "@/lib/course";
import { grantAccess, unlockFullAccess } from "@/lib/access";
import { getCourseId } from "@/lib/supabase/db";
import type { LessonContentBlock, LessonRow, PricingKind } from "@/lib/types";
import { decideRequest } from "@/lib/enrollment-requests";
import { reviewSubmission } from "@/lib/homework";
import { isTeacher } from "@/lib/cohorts";

// ============================================================================
// Admin CMS server action'lari. Har biri clientga ishonmaydi:
// rolni serverda qayta tekshiradi, service-role bilan yozadi va
// kontent sahifalarini revalidate qiladi.
// ============================================================================

async function requireAdminDb() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/dashboard");
  const admin = createSupabaseAdmin();
  if (!admin) {
    // Service key yo'q — yozib bo'lmaydi; sahifada ham forma ko'rsatilmaydi.
    redirect("/admin?error=no-service-key");
  }
  return admin;
}

async function requireTeacherDb() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/homework");
  if (!isTeacher(user)) redirect("/dashboard");
  const admin = createSupabaseAdmin();
  if (!admin) redirect("/admin/homework?error=no-service-key");
  return { admin, user };
}

/** Barcha kontent ko'rinadigan sahifalarni yangilaydi. */
function revalidateContent() {
  revalidatePath("/", "layout");
}

function readAccountForm(formData: FormData) {
  const login = normalizeLogin(String(formData.get("login") ?? ""));
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const courseSlug = String(formData.get("courseSlug") ?? "");
  const kind = String(formData.get("kind") ?? "lifetime") as PricingKind;
  if (!login || !fullName || password.length < 8 || !courseSlug || !["lifetime", "monthly"].includes(kind)) {
    return null;
  }
  return { login, password, fullName, contact, courseSlug, kind };
}

/** Chek Telegram'da tekshirilgach yangi o'quvchi va uning kirishini yaratadi. */
export async function createStudentAccount(formData: FormData) {
  const admin = await requireAdminDb();
  const input = readAccountForm(formData);
  if (!input) redirect("/admin?error=account-invalid#oquvchi");

  const course = await getCourseAsync(input.courseSlug);
  const option = course?.pricing.find((p) => p.kind === input.kind);
  const courseId = await getCourseId(input.courseSlug);
  if (!course || !option || !courseId) redirect("/admin?error=account-invalid#oquvchi");

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: emailForLogin(input.login),
    password: input.password,
    email_confirm: true,
  });
  if (authError || !authData.user) {
    console.error("[admin] create student auth failed", authError);
    redirect("/admin?error=account-duplicate#oquvchi");
  }

  const userId = authData.user.id;
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    login: input.login,
    full_name: input.fullName,
    phone: input.contact || null,
    role: "student",
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    console.error("[admin] create student profile failed", profileError);
    redirect("/admin?error=account-duplicate#oquvchi");
  }

  try {
    await grantAccess(userId, input.courseSlug, input.kind);
    const { error: paymentError } = await admin.from("payments").insert({
      user_id: userId,
      course_id: courseId,
      amount_uzs: option.priceUzs,
      provider: "manual",
      kind: input.kind,
      step: 1,
      status: "paid",
      paid_at: new Date().toISOString(),
      raw: { approved_in_admin: true, contact: input.contact || null },
    });
    if (paymentError) throw paymentError;
  } catch (error) {
    console.error("[admin] create student entitlement failed", error);
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
    redirect("/admin?error=account-save#oquvchi");
  }

  revalidateContent();
  redirect("/admin?saved=student#oquvchi");
}

/** Mavjud qisman yozilgan o'quvchining ikkinchi to'lovini tasdiqlaydi. */
export async function approveSecondInstallment(formData: FormData) {
  const admin = await requireAdminDb();
  const login = normalizeLogin(String(formData.get("login") ?? ""));
  const courseSlug = String(formData.get("courseSlug") ?? "");
  if (!login || !courseSlug) redirect("/admin?error=account-invalid#oquvchi");

  const { data: profile } = await admin.from("profiles").select("id").eq("login", login).maybeSingle();
  const course = await getCourseAsync(courseSlug);
  const option = course?.pricing.find((p) => p.kind === "installment2");
  const courseId = await getCourseId(courseSlug);
  if (!profile || !course || !option || !courseId) redirect("/admin?error=account-invalid#oquvchi");

  await unlockFullAccess(profile.id, courseSlug);
  const { error } = await admin.from("payments").insert({
    user_id: profile.id,
    course_id: courseId,
    amount_uzs: option.priceUzs,
    provider: "manual",
    kind: "installment2",
    step: 2,
    status: "paid",
    paid_at: new Date().toISOString(),
    raw: { approved_in_admin: true },
  });
  if (error) {
    console.error("[admin] approve second installment failed", error);
    redirect("/admin?error=account-save#oquvchi");
  }
  revalidateContent();
  redirect("/admin?saved=installment#oquvchi");
}

/** Oyma-oy to'lov tasdiqlanganda mavjud o'quvchining kirishini yana 30 kunga uzaytiradi. */
export async function renewMonthlyAccess(formData: FormData) {
  const admin = await requireAdminDb();
  const login = normalizeLogin(String(formData.get("login") ?? ""));
  const courseSlug = String(formData.get("courseSlug") ?? "");
  if (!login || !courseSlug) redirect("/admin?error=account-invalid#oquvchi");

  const { data: profile } = await admin.from("profiles").select("id").eq("login", login).maybeSingle();
  const course = await getCourseAsync(courseSlug);
  const option = course?.pricing.find((p) => p.kind === "monthly");
  const courseId = await getCourseId(courseSlug);
  if (!profile || !option || !courseId) redirect("/admin?error=account-invalid#oquvchi");

  await grantAccess(profile.id, courseSlug, "monthly");
  const { error } = await admin.from("payments").insert({
    user_id: profile.id, course_id: courseId, amount_uzs: option.priceUzs, provider: "manual",
    kind: "monthly", step: 1, status: "paid", paid_at: new Date().toISOString(), raw: { approved_in_admin: true, renewal: true },
  });
  if (error) {
    console.error("[admin] renew monthly access failed", error);
    redirect("/admin?error=account-save#oquvchi");
  }
  revalidateContent();
  redirect("/admin?saved=monthly#oquvchi");
}

/** Foydalanuvchi paroli administrator orqali yangilanadi. */
export async function resetStudentPassword(formData: FormData) {
  const admin = await requireAdminDb();
  const login = normalizeLogin(String(formData.get("login") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!login || password.length < 8) redirect("/admin?error=account-invalid#oquvchi");
  const { data: profile } = await admin.from("profiles").select("id").eq("login", login).maybeSingle();
  if (!profile) redirect("/admin?error=account-invalid#oquvchi");
  const { error } = await admin.auth.admin.updateUserById(profile.id, { password });
  if (error) {
    console.error("[admin] reset student password failed", error);
    redirect("/admin?error=account-save#oquvchi");
  }
  redirect("/admin?saved=password#oquvchi");
}

/** Mavjud hisobga instructor rolini beradi yoki student roliga qaytaradi. */
export async function setInstructorRole(formData: FormData) {
  const admin = await requireAdminDb();
  const login = normalizeLogin(String(formData.get("login") ?? ""));
  const role = formData.get("role") === "instructor" ? "instructor" : "student";
  if (!login) redirect("/admin?error=account-invalid#oquvchi");
  const { data: profile } = await admin.from("profiles").select("id, role").eq("login", login).maybeSingle();
  if (!profile || profile.role === "admin") redirect("/admin?error=account-invalid#oquvchi");
  const { error } = await admin.from("profiles").update({ role }).eq("id", profile.id);
  if (error) redirect("/admin?error=account-save#oquvchi");
  revalidatePath("/teacher");
  redirect("/admin?saved=role#oquvchi");
}

// ---- Ro'yxatdan o'tish arizalari --------------------------------------------

/** Arizani aloqaga oladi. Kirish faqat teacher checkout payment paid bo'lgach ochiladi. */
export async function approveEnrollmentRequest(formData: FormData) {
  await requireAdminDb();
  const admin = await getCurrentUser();
  const requestId = String(formData.get("requestId") ?? "");
  const courseSlug = String(formData.get("courseSlug") ?? "");
  if (!requestId || !courseSlug || !admin) redirect("/admin?error=account-invalid#arizalar");

  const userId = await decideRequest(requestId, admin.id, true);
  if (!userId) redirect("/admin?error=account-save#arizalar");
  revalidateContent();
  redirect("/admin?saved=request-contacted#arizalar");
}

/** Arizani rad etadi (kirish berilmaydi). */
export async function rejectEnrollmentRequest(formData: FormData) {
  await requireAdminDb();
  const admin = await getCurrentUser();
  const requestId = String(formData.get("requestId") ?? "");
  if (!requestId || !admin) redirect("/admin?error=account-invalid#arizalar");

  const userId = await decideRequest(requestId, admin.id, false);
  if (!userId) redirect("/admin?error=account-save#arizalar");
  revalidateContent();
  redirect("/admin?saved=request-rejected#arizalar");
}

// ---- Uy vazifalari -----------------------------------------------------------

/** Ustoz AI bergan bahoni ko'rib chiqib tahrirlaydi/tasdiqlaydi. */
export async function reviewHomeworkSubmission(formData: FormData) {
  const { admin: db, user: teacher } = await requireTeacherDb();
  const submissionId = String(formData.get("submissionId") ?? "");
  const score = Number(formData.get("score") ?? 0);
  const feedback = String(formData.get("feedback") ?? "");
  if (!submissionId || !Number.isFinite(score)) redirect("/admin/homework?error=invalid");

  if (teacher.role === "instructor") {
    const { data: submission } = await db.from("homework_submissions").select("user_id").eq("id", submissionId).maybeSingle();
    const { data: teaching } = await db.from("cohort_members").select("cohort_id")
      .eq("user_id", teacher.id).eq("member_role", "instructor").neq("status", "removed");
    const cohortIds = (teaching ?? []).map((row) => row.cohort_id as string);
    const { data: student } = submission && cohortIds.length
      ? await db.from("cohort_members").select("user_id").in("cohort_id", cohortIds)
          .eq("user_id", submission.user_id).eq("member_role", "student").neq("status", "removed").limit(1).maybeSingle()
      : { data: null };
    if (!student) redirect("/admin/homework?error=forbidden");
  }

  const ok = await reviewSubmission(submissionId, teacher.id, score, feedback);
  if (!ok) redirect("/admin/homework?error=save");
  revalidateContent();
  redirect(`/admin/homework?saved=1#hw-${submissionId}`);
}

// ---- Narxlar ---------------------------------------------------------------

export async function updatePricing(formData: FormData) {
  const admin = await requireAdminDb();
  const id = String(formData.get("id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const priceUzs = Math.max(0, Math.round(Number(formData.get("priceUzs") ?? 0)));
  const note = String(formData.get("note") ?? "").trim();
  if (!id || !label || !priceUzs) redirect("/admin?error=invalid");

  const { error } = await admin
    .from("pricing_options")
    .update({ label, price_uzs: priceUzs, note })
    .eq("id", id);
  if (error) {
    console.error("[admin] updatePricing failed", error);
    redirect("/admin?error=save");
  }
  revalidateContent();
  redirect("/admin?saved=1#narxlar");
}

// ---- Darslar ---------------------------------------------------------------

function rowsFromForm(formData: FormData): LessonRow[] {
  return ([
    ["Nazariy", "rowNazariy"],
    ["Amaliy", "rowAmaliy"],
    ["Natija", "rowNatija"],
  ] as const).map(([kind, field]) => ({
    kind,
    text: String(formData.get(field) ?? "").trim(),
  }));
}

function contentFromForm(formData: FormData): LessonContentBlock[] | null {
  const raw = String(formData.get("contentJson") ?? "[]").trim();
  if (raw.length > 100_000) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return null;
    const allowed = new Set(["paragraph", "heading", "image", "callout", "steps", "prompt", "task"]);
    if (!value.every((block) => block && typeof block === "object" && allowed.has(String((block as { type?: unknown }).type)))) return null;
    return value as LessonContentBlock[];
  } catch {
    return null;
  }
}

export async function updateLesson(formData: FormData) {
  const admin = await requireAdminDb();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) redirect("/admin?error=invalid");

  const videoKey = String(formData.get("videoKey") ?? "").trim();
  const youtubeId = String(formData.get("youtubeId") ?? "").trim();
  const durationSec = Math.max(0, Math.round(Number(formData.get("durationSec") ?? 0)));
  const content = contentFromForm(formData);
  if (!content) redirect("/admin?error=invalid");

  const { error } = await admin
    .from("lessons")
    .update({
      title,
      video_key: videoKey || null,
      youtube_id: youtubeId || null,
      duration_sec: durationSec,
      is_preview: formData.get("isPreview") === "on",
      sandbox_enabled: formData.get("sandboxEnabled") === "on",
      rows: rowsFromForm(formData),
      content,
    })
    .eq("id", id);
  if (error) {
    console.error("[admin] updateLesson failed", error);
    redirect("/admin?error=save");
  }
  revalidateContent();
  redirect(`/admin?saved=1#lesson-${id}`);
}

export async function createLesson(formData: FormData) {
  const admin = await requireAdminDb();
  const moduleId = String(formData.get("moduleId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const order = Math.round(Number(formData.get("order") ?? 0));
  if (!moduleId || !title || !order) redirect("/admin?error=invalid");

  // Global tartib kurs bo'ylab unikal bo'lishi SHART: DB'dagi unique faqat
  // (module_id, order) — boshqa modulda bir xil order paydo bo'lsa, slug+order
  // bo'yicha lookup (getLessonId) ikkita qator ko'rib null qaytaradi va
  // progress/quiz/sandbox shu dars uchun jimgina ishlamay qoladi.
  const { data: mod } = await admin.from("modules").select("course_id").eq("id", moduleId).maybeSingle();
  if (!mod) redirect("/admin?error=invalid");
  const { count: dupCount } = await admin
    .from("lessons")
    .select("id, modules!inner(course_id)", { count: "exact", head: true })
    .eq("modules.course_id", mod.course_id)
    .eq("order", order);
  if ((dupCount ?? 0) > 0) redirect("/admin?error=duplicate-order");

  const { error } = await admin.from("lessons").insert({
    module_id: moduleId,
    order,
    title,
    type: "video",
    is_preview: false,
    rows: [
      { kind: "Nazariy", text: "" },
      { kind: "Amaliy", text: "" },
      { kind: "Natija", text: "" },
    ],
  });
  if (error) {
    console.error("[admin] createLesson failed", error);
    redirect("/admin?error=save");
  }
  revalidateContent();
  redirect("/admin?saved=1");
}

// ---- Savollar (quiz) ---------------------------------------------------------

/**
 * Savolni yaratadi yoki yangilaydi. MVP: har savolda 4 tagacha variant,
 * bittasi to'g'ri. Yangilashda variantlar to'liq almashtiriladi.
 */
export async function upsertQuizQuestion(formData: FormData) {
  const admin = await requireAdminDb();
  const questionId = String(formData.get("questionId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const prompt = String(formData.get("prompt") ?? "").trim();
  const explanation = String(formData.get("explanation") ?? "").trim();
  const points = Math.max(1, Math.round(Number(formData.get("points") ?? 10)));
  const correct = Number(formData.get("correct") ?? 1);

  const options = [1, 2, 3, 4]
    .map((n) => ({ n, text: String(formData.get(`opt${n}`) ?? "").trim() }))
    .filter((o) => o.text);

  if (!lessonId || !prompt || options.length < 2 || !options.some((o) => o.n === correct)) {
    redirect("/admin?error=invalid");
  }

  const { data: qid, error } = await admin.rpc("replace_quiz_question", {
    p_question_id: questionId || null,
    p_lesson_id: lessonId,
    p_prompt: prompt,
    p_explanation: explanation || null,
    p_points: points,
    p_options: options.map((o, i) => ({
      order: i + 1,
      text: o.text,
      is_correct: o.n === correct,
    })),
  });
  if (error || !qid) {
    console.error("[admin] quiz transaction failed", error);
    redirect("/admin?error=save");
  }

  revalidateContent();
  redirect(`/admin?saved=1#quiz-${qid}`);
}

export async function deleteQuizQuestion(formData: FormData) {
  const admin = await requireAdminDb();
  const questionId = String(formData.get("questionId") ?? "");
  if (!questionId) redirect("/admin?error=invalid");
  const { error } = await admin.from("quiz_questions").delete().eq("id", questionId);
  if (error) {
    console.error("[admin] quiz delete failed", error);
    redirect("/admin?error=save");
  }
  revalidateContent();
  redirect("/admin?saved=1");
}
