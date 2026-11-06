import "server-only";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { PaymentProvider, PricingKind } from "@/lib/types";

// ============================================================================
// `payments` jadvali bilan ishlash — faqat real rejim (service role).
// Faqat bepul manual (Telegram) to'lov oqimi uchun ishlatiladi — Payme/Click/
// Uzum integratsiyasi hech qachon jonli sozlanmagani uchun olib tashlangan.
// ============================================================================

export interface PaymentRow {
  id: string;
  userId: string;
  courseSlug: string | null;
  amountUzs: number;
  provider: PaymentProvider;
  providerTxnId: string | null;
  status: "pending" | "paid" | "canceled";
  kind: PricingKind;
  step: number;
  raw: Record<string, unknown>;
  telegramChatId: number | null;
  createdAt: string;
  paidAt: string | null;
  enrollmentRequestId: string | null;
  cohortId: string | null;
}

interface DbPaymentRow {
  id: string;
  user_id: string;
  amount_uzs: number;
  provider: string;
  provider_txn_id: string | null;
  status: string;
  kind: string;
  step: number | null;
  raw: Record<string, unknown> | null;
  telegram_chat_id: number | null;
  created_at: string;
  paid_at: string | null;
  enrollment_request_id: string | null;
  cohort_id: string | null;
  courses: { slug: string } | null;
}

const SELECT = "id, user_id, amount_uzs, provider, provider_txn_id, status, kind, step, raw, telegram_chat_id, created_at, paid_at, enrollment_request_id, cohort_id, courses(slug)";

function mapRow(r: DbPaymentRow): PaymentRow {
  return {
    id: r.id,
    userId: r.user_id,
    courseSlug: r.courses?.slug ?? null,
    amountUzs: r.amount_uzs,
    provider: r.provider as PaymentProvider,
    providerTxnId: r.provider_txn_id,
    status: r.status as PaymentRow["status"],
    kind: r.kind as PricingKind,
    step: r.step ?? 1,
    raw: r.raw ?? {},
    telegramChatId: r.telegram_chat_id ?? null,
    createdAt: r.created_at,
    paidAt: r.paid_at,
    enrollmentRequestId: r.enrollment_request_id,
    cohortId: r.cohort_id,
  };
}

/** Ariza bilan bog'langan, faqat shu foydalanuvchiga tegishli checkout buyurtmasi. */
export async function getPaymentForCheckout(userId: string, orderId: string): Promise<PaymentRow | null> {
  const payment = await getPaymentByOrderId(orderId);
  return payment?.userId === userId && payment.status === "pending" ? payment : null;
}

/** Dashboard uchun foydalanuvchining oxirgi kutilayotgan buyurtmasi. */
export async function getPendingPaymentForUser(userId: string, courseSlug: string): Promise<PaymentRow | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from("payments")
    .select(SELECT.replace("courses(slug)", "courses!inner(slug)"))
    .eq("user_id", userId)
    .eq("status", "pending")
    .eq("courses.slug", courseSlug)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[payments] pending payment lookup failed", error);
    return null;
  }
  return data ? mapRow(data as unknown as DbPaymentRow) : null;
}

export async function getPendingPaymentForRequest(requestId: string): Promise<PaymentRow | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin.from("payments").select(SELECT)
    .eq("enrollment_request_id", requestId).eq("status", "pending")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) return null;
  return data ? mapRow(data as unknown as DbPaymentRow) : null;
}

/** Ustoz aloqasidan keyin shaxsiy payment order yaratadi; takroriy bosishda mavjudini qaytaradi. */
export async function createPaymentForRequest(
  requestId: string,
  cohortId: string,
  kind: Extract<PricingKind, "lifetime" | "monthly">,
): Promise<string | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const { data: request, error: requestError } = await admin
    .from("enrollment_requests")
    .select("id, user_id, course_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (requestError || !request || !["pending", "contacted", "payment_pending"].includes(request.status as string)) return null;

  const { data: cohort } = await admin
    .from("cohorts")
    .select("id, course_id")
    .eq("id", cohortId)
    .eq("course_id", request.course_id)
    .maybeSingle();
  if (!cohort) return null;

  const { data: existing } = await admin
    .from("payments")
    .select("id")
    .eq("enrollment_request_id", requestId)
    .eq("kind", kind)
    .eq("step", 1)
    .eq("status", "pending")
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data: pricing } = await admin
    .from("pricing_options")
    .select("price_uzs")
    .eq("course_id", request.course_id)
    .eq("kind", kind)
    .maybeSingle();
  if (!pricing) return null;

  const { data: payment, error } = await admin
    .from("payments")
    .insert({
      user_id: request.user_id,
      course_id: request.course_id,
      amount_uzs: pricing.price_uzs,
      provider: "manual",
      kind,
      step: 1,
      status: "pending",
      enrollment_request_id: requestId,
      cohort_id: cohortId,
      raw: { created_from: "teacher_application" },
    })
    .select("id")
    .single();
  if (error || !payment) {
    if (error?.code === "23505") {
      const { data: raced } = await admin.from("payments").select("id")
        .eq("enrollment_request_id", requestId).eq("kind", kind).eq("step", 1).eq("status", "pending").maybeSingle();
      if (raced?.id) return raced.id as string;
    }
    console.error("[payments] create request order failed", error);
    return null;
  }
  const { error: updateError } = await admin
    .from("enrollment_requests")
    .update({ status: "payment_pending", contacted_at: new Date().toISOString(), cohort_id: cohortId, selected_kind: kind })
    .eq("id", requestId);
  if (updateError) {
    await admin.from("payments").delete().eq("id", payment.id).eq("status", "pending");
    console.error("[payments] request status update failed", updateError);
    return null;
  }
  return payment.id as string;
}

/** Buyurtma raqami (bizning payments.id) bo'yicha to'lovni topadi. */
export async function getPaymentByOrderId(orderId: string): Promise<PaymentRow | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  // UUID bo'lmagan qiymat Postgres'da xato beradi — oldindan tekshiramiz.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) return null;
  const { data, error } = await admin.from("payments").select(SELECT).eq("id", orderId).maybeSingle();
  if (error) console.error("[payments] getPaymentByOrderId failed", error);
  return data ? mapRow(data as unknown as DbPaymentRow) : null;
}

/** Manual Telegram oqimi uchun chat ID va receipt metadata'sini yozadi. */
export async function updatePaymentTelegram(
  paymentId: string,
  chatId: number,
  telegram: Record<string, unknown>,
): Promise<boolean> {
  const admin = createSupabaseAdmin();
  if (!admin) return false;
  const { data: current, error: readError } = await admin
    .from("payments")
    .select("raw, provider, status")
    .eq("id", paymentId)
    .maybeSingle();
  if (readError || !current || current.provider !== "manual" || current.status !== "pending") return false;
  const { error } = await admin
    .from("payments")
    .update({
      telegram_chat_id: chatId,
      raw: {
        ...((current.raw as Record<string, unknown> | null) ?? {}),
        telegram: {
          ...(((current.raw as Record<string, unknown> | null)?.telegram as Record<string, unknown> | undefined) ?? {}),
          ...telegram,
        },
      },
    })
    .eq("id", paymentId)
    .eq("provider", "manual")
    .eq("status", "pending");
  if (error) {
    console.error("[payments] updatePaymentTelegram failed", error);
    return false;
  }
  return true;
}

/**
 * To'lovni PAID qiladi va kirishni ochadi.
 *
 * TARTIB MUHIM: avval kirish ochiladi, KEYIN paid holati yoziladi. Aks holda
 * grant xato berganda paid allaqachon yozilgan bo'lar edi — provayderning
 * retry'i (masalan Payme state=2 short-circuit) grant'ni qayta chaqirmasdan
 * muvaffaqiyat qaytarar va foydalanuvchi "to'lagan-lekin-kirishsiz" qolar edi.
 * Grant idempotent (upsert) — retry'da qayta bajarilishi xavfsiz.
 */
export async function markPaymentPaid(
  payment: PaymentRow,
  fields: { providerTxnId?: string; raw?: Record<string, unknown> },
): Promise<void> {
  const admin = createSupabaseAdmin();
  if (!admin) return;

  // Retry callbacklar allaqachon paid bo'lgan manual/installment to'lovni
  // qayta grant qilib, to'liq kirishni qayta qulflamasligi kerak.
  if (payment.status === "paid") return;
  if (payment.status !== "pending") throw new Error("To'lov holati tasdiqlashga yaroqsiz");

  const { data, error } = await admin.rpc("finalize_payment_once", {
    p_payment_id: payment.id,
    p_provider_txn_id: fields.providerTxnId ?? payment.providerTxnId,
    p_raw: fields.raw ?? null,
  });
  if (error) {
    console.error("[payments] markPaymentPaid failed", error);
    throw new Error("To'lovni saqlashda xatolik");
  }
  if (data !== true && payment.status === "pending") {
    throw new Error("To'lov holati o'zgargan, qayta urinib ko'ring");
  }

  // 0013 migratsiyasidagi trigger buni atomik qiladi. Quyidagi idempotent
  // yozuvlar eski/kechikib migratsiya qilingan muhitda ham oqimni yakunlaydi.
  if (payment.enrollmentRequestId) {
    await admin.from("enrollment_requests").update({
      status: "approved",
      decided_at: new Date().toISOString(),
      cohort_id: payment.cohortId,
      selected_kind: payment.kind,
    }).eq("id", payment.enrollmentRequestId);
  }
  if (payment.cohortId) {
    await admin.from("cohort_members").upsert({
      cohort_id: payment.cohortId,
      user_id: payment.userId,
      member_role: "student",
      status: "active",
      joined_at: new Date().toISOString(),
    }, { onConflict: "cohort_id,user_id" });
  }
}

/** Admin qo'lda tasdiqlagan payment va entitlement'ni bitta DB transactionda yozadi. */
export async function recordManualAccessPayment(input: {
  userId: string;
  courseId: string;
  amountUzs: number;
  kind: PricingKind;
  step: 1 | 2;
  actorId: string;
  raw?: Record<string, unknown>;
}): Promise<string | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin.rpc("record_manual_access_payment", {
    p_user_id: input.userId,
    p_course_id: input.courseId,
    p_amount_uzs: input.amountUzs,
    p_kind: input.kind,
    p_step: input.step,
    p_actor_id: input.actorId,
    p_raw: input.raw ?? {},
  });
  if (error || !data) {
    console.error("[payments] atomic manual access failed", error);
    return null;
  }
  return data as string;
}
