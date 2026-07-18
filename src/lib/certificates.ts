import "server-only";
import crypto from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabasePublic } from "@/lib/supabase/public";
import { getCourseId } from "@/lib/supabase/db";

// ============================================================================
// Sertifikatlar — kurs 100% yakunlanganda bir marta beriladi.
// `certificates` jadvali public-read (tekshiruv havolasi tashqi odamlar
// uchun ham ishlaydi), yozish faqat service role.
// ============================================================================

/** O'qilishi oson, taxmin qilib bo'lmaydigan kod: TJ-XXXX-XXXX */
function newCertificateCode(): string {
  const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
  return `TJ-${raw.slice(0, 5)}-${raw.slice(5)}`;
}

/**
 * Kurs 100% bo'lganda sertifikat yozadi (unique(user_id, course_id) —
 * takroriy chaqiruv dublikat yaratmaydi). Kodini qaytaradi.
 */
export async function issueCertificateIfEligible(
  userId: string,
  courseSlug: string,
): Promise<string | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const courseId = await getCourseId(courseSlug);
  if (!courseId) return null;

  const { data: existing } = await admin
    .from("certificates")
    .select("code")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  if (existing) return existing.code as string;

  const code = newCertificateCode();
  const { error } = await admin
    .from("certificates")
    .insert({ user_id: userId, course_id: courseId, code });
  if (error) {
    // Poyga holati: parallel yozuv unique'ga urilsa — mavjudini qaytaramiz.
    const { data: retry } = await admin
      .from("certificates")
      .select("code")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();
    return (retry?.code as string | undefined) ?? null;
  }
  return code;
}

/** Foydalanuvchining kursdagi sertifikati (bo'lsa). */
export async function getCertificate(
  userId: string,
  courseSlug: string,
): Promise<{ code: string; issuedAt: string } | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const courseId = await getCourseId(courseSlug);
  if (!courseId) return null;
  const { data } = await admin
    .from("certificates")
    .select("code, issued_at")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  return data ? { code: data.code as string, issuedAt: data.issued_at as string } : null;
}

export interface PublicCertificate {
  code: string;
  issuedAt: string;
  courseTitle: string;
  holderName: string;
}

/**
 * Ochiq tekshiruv sahifasi uchun: kod bo'yicha sertifikat.
 * certificates+courses public-read — anon kalit yetadi; ism profiles'dan
 * (RLS yopiq) — service key bo'lsa olinadi, bo'lmasa umumiy nom.
 */
export async function getCertificateByCode(code: string): Promise<PublicCertificate | null> {
  const client = createSupabaseAdmin() ?? createSupabasePublic();
  if (!client) return null;

  const { data } = await client
    .from("certificates")
    .select("code, issued_at, user_id, courses ( title )")
    .eq("code", code)
    .maybeSingle();
  if (!data) return null;

  let holderName = "Tech Jadid o'quvchisi";
  const admin = createSupabaseAdmin();
  if (admin) {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", data.user_id as string)
      .maybeSingle();
    if (profile?.full_name) holderName = profile.full_name as string;
  }

  const course = data.courses as unknown as { title: string } | null;
  return {
    code: data.code as string,
    issuedAt: data.issued_at as string,
    courseTitle: course?.title ?? "",
    holderName,
  };
}
