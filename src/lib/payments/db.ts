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
  courses: { slug: string } | null;
}

const SELECT = "id, user_id, amount_uzs, provider, provider_txn_id, status, kind, step, raw, telegram_chat_id, created_at, paid_at, courses(slug)";

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
  };
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
}
