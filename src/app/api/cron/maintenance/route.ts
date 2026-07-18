import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

// ============================================================================
// Vercel Cron — kunlik texnik ishlar (eski "renew-subscriptions" o'rnida:
// narx modeli obunadan bir martalik/2-bo'lib to'lashga o'tgani uchun obuna
// uzaytirish yo'q).
//
// Hozirgi vazifa: 24 soatdan beri osilib qolgan pending to'lovlarni bekor
// qilish (foydalanuvchi provayder sahifasidan qaytmagan buyurtmalar).
// Payme tranzaksiyasi boshlangan qatorlarda raw.payme.state ham -1 qilinadi —
// aks holda Payme CheckTransaction "faol" (state=1) deb ko'raveradi.
// Muddat tugagan monthly yozilishlar alohida ishlov talab qilmaydi —
// isEnrollmentExpired o'qish paytida tekshiradi.
//
// Xavfsizlik: Authorization: Bearer CRON_SECRET.
// ============================================================================

const STALE_PENDING_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!env.cronSecret || auth !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: true, note: "Supabase service key yo'q — demo rejim." });
  }

  const cutoff = new Date(Date.now() - STALE_PENDING_MS).toISOString();
  const { data: stale, error } = await admin
    .from("payments")
    .select("id, raw")
    .eq("status", "pending")
    .lt("created_at", cutoff);

  if (error) {
    console.error("[cron] stale pending lookup failed", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let canceled = 0;
  for (const row of stale ?? []) {
    const raw = (row.raw as Record<string, unknown> | null) ?? {};
    const payme = raw.payme as { state?: number } | undefined;
    const newRaw =
      payme && payme.state === 1
        ? { ...raw, payme: { ...payme, state: -1, cancel_time: Date.now(), reason: 4 } }
        : raw;
    const { error: updError } = await admin
      .from("payments")
      .update({ status: "canceled", raw: newRaw })
      .eq("id", row.id)
      .eq("status", "pending"); // poyga: shu orada to'lansa tegmaymiz
    if (updError) console.error("[cron] cancel failed", row.id, updError);
    else canceled += 1;
  }

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    canceledStalePayments: canceled,
  });
}
