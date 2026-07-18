import "server-only";
import { cookies } from "next/headers";
import type { EnrollmentRequest, EnrollmentRequestStatus } from "./types";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCourseId } from "@/lib/supabase/db";
import { grantAccess } from "@/lib/access";
import { sendTelegramMessage, telegramConfigured } from "@/lib/telegram";

// ============================================================================
// Ro'yxatdan o'tish arizalari — dual-mode (access.ts andozasi bo'yicha).
//
// REAL rejim: Supabase `enrollment_requests` jadvali (o'qish RLS, yozish
// service role). Tasdiqlash/rad etish faqat admin panel orqali (service role
// talab qiladi — access.ts dagi boshqa admin amallari kabi).
// DEMO rejim: `tj_enroll_request` cookie'da JSON ro'yxat — faqat holatni
// ko'rsatish uchun; tasdiqlash demo rejimda mavjud emas (admin ham service
// role talab qiladi).
// ============================================================================

const COOKIE = "tj_enroll_request";

export interface PendingRequestWithProfile extends EnrollmentRequest {
  login: string | null;
  fullName: string | null;
}

/** O'quvchining shu kursga (hali qaror qilinmagan yoki oxirgi) arizasi. */
export async function getRequestStatus(userId: string, courseSlug: string): Promise<EnrollmentRequest | null> {
  if (isSupabaseConfigured) return getDbRequestStatus(userId, courseSlug);
  const all = await readCookieRequests();
  const mine = all.filter((r) => r.userId === userId && r.courseSlug === courseSlug);
  if (mine.length === 0) return null;
  // Pending eng ustuvor (mavjud bo'lsa); aks holda oxirgisi.
  return mine.find((r) => r.status === "pending") ?? mine[mine.length - 1];
}

/** Yangi ariza yaratadi (allaqachon pending bo'lsa — mavjudini qaytaradi). Muvaffaqiyatli bo'lsa ustozga Telegram xabari yuboradi. */
export async function createRequest(userId: string, courseSlug: string, contact: string, displayName: string): Promise<void> {
  const existing = await getRequestStatus(userId, courseSlug);
  if (existing?.status === "pending") return;

  if (isSupabaseConfigured) {
    const admin = createSupabaseAdmin();
    if (!admin) return;
    const courseId = await getCourseId(courseSlug);
    if (!courseId) return;
    const { data, error } = await admin
      .from("enrollment_requests")
      .insert({ user_id: userId, course_id: courseId, contact: contact || null })
      .select("id")
      .single();
    if (error) {
      console.error("[enrollment-requests] createRequest failed", error);
      return;
    }
    await notifyAdminsOfNewRequest(data.id as string, displayName, contact);
    return;
  }

  const store = await cookies();
  const all = await readCookieRequests();
  all.push({
    id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    courseSlug,
    status: "pending",
    contact: contact || null,
    createdAt: new Date().toISOString(),
  });
  store.set(COOKIE, JSON.stringify(all), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/** Ustozga Telegram orqali xabar + darhol tasdiqlash/rad etish tugmalari. */
async function notifyAdminsOfNewRequest(requestId: string, displayName: string, contact: string): Promise<void> {
  if (!telegramConfigured()) return;
  const text = [
    "📝 Yangi ro'yxatdan o'tish arizasi",
    `Ism: ${displayName}`,
    `Kontakt: ${contact || "—"}`,
  ].join("\n");
  const keyboard = {
    inline_keyboard: [[
      { text: "✅ Tasdiqlash", callback_data: `enroll:approve:${requestId}` },
      { text: "❌ Rad etish", callback_data: `enroll:reject:${requestId}` },
    ]],
  };
  await Promise.all(env.telegramAdminIds.map((adminId) => sendTelegramMessage(adminId, text, keyboard)));
}

/** Telegram (bot) orqali ariza qarorini qabul qiladi — tasdiqlansa kirishni ham ochadi. */
export async function decideRequestFromTelegram(
  requestId: string,
  approve: boolean,
): Promise<{ userId: string; courseSlug: string } | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;

  const { data: request, error } = await admin
    .from("enrollment_requests")
    .select("user_id, status, courses(slug)")
    .eq("id", requestId)
    .maybeSingle();
  if (error || !request || request.status !== "pending") return null;
  const courseSlug = (request.courses as unknown as { slug: string } | null)?.slug;
  if (!courseSlug) return null;

  const { error: updateError } = await admin
    .from("enrollment_requests")
    .update({ status: approve ? "approved" : "rejected", decided_at: new Date().toISOString() })
    .eq("id", requestId);
  if (updateError) {
    console.error("[enrollment-requests] decideRequestFromTelegram failed", updateError);
    return null;
  }

  const userId = request.user_id as string;
  if (approve) await grantAccess(userId, courseSlug, "admin");
  return { userId, courseSlug };
}

/** Admin panel uchun — bitta kursning kutilayotgan arizalari (profil bilan). */
export async function listPendingRequests(courseSlug: string): Promise<PendingRequestWithProfile[]> {
  const admin = createSupabaseAdmin();
  if (!admin) return [];
  const courseId = await getCourseId(courseSlug);
  if (!courseId) return [];

  const { data, error } = await admin
    .from("enrollment_requests")
    .select("id, user_id, status, contact, created_at")
    .eq("course_id", courseId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[enrollment-requests] listPendingRequests failed", error);
    return [];
  }
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const userIds = rows.map((r) => r.user_id as string);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, login, full_name")
    .in("id", userIds);
  const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  return rows.map((r) => {
    const profile = profileById.get(r.user_id as string);
    return {
      id: r.id as string,
      userId: r.user_id as string,
      courseSlug,
      status: r.status as EnrollmentRequestStatus,
      contact: (r.contact as string | null) ?? null,
      createdAt: r.created_at as string,
      login: (profile?.login as string | undefined) ?? null,
      fullName: (profile?.full_name as string | undefined) ?? null,
    };
  });
}

/** Arizani tasdiqlaydi/rad etadi (kirish huquqini berish chaqiruvchida). */
export async function decideRequest(requestId: string, decidedBy: string, approve: boolean): Promise<string | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const { data: request, error: fetchError } = await admin
    .from("enrollment_requests")
    .select("user_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (fetchError || !request || request.status !== "pending") return null;

  const { error } = await admin
    .from("enrollment_requests")
    .update({ status: approve ? "approved" : "rejected", decided_at: new Date().toISOString(), decided_by: decidedBy })
    .eq("id", requestId);
  if (error) {
    console.error("[enrollment-requests] decideRequest failed", error);
    return null;
  }
  return request.user_id as string;
}

// ---- REAL rejim ------------------------------------------------------------

async function getDbRequestStatus(userId: string, courseSlug: string): Promise<EnrollmentRequest | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const courseId = await getCourseId(courseSlug);
  if (!courseId) return null;
  const { data, error } = await admin
    .from("enrollment_requests")
    .select("id, status, contact, created_at")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) console.error("[enrollment-requests] getDbRequestStatus failed", error);
  if (!data) return null;
  return {
    id: data.id as string,
    userId,
    courseSlug,
    status: data.status as EnrollmentRequestStatus,
    contact: (data.contact as string | null) ?? null,
    createdAt: data.created_at as string,
  };
}

// ---- DEMO rejim -------------------------------------------------------------

async function readCookieRequests(): Promise<EnrollmentRequest[]> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return [];
  try {
    return JSON.parse(raw) as EnrollmentRequest[];
  } catch {
    return [];
  }
}
