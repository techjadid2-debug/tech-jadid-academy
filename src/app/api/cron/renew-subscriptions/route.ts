import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// Vercel Cron — obuna muddatini boshqarish (kuniga bir marta).
// vercel.json: { "crons": [{ "path": "/api/cron/renew-subscriptions", "schedule": "0 3 * * *" }] }
//
// Skelet: Supabase ulangach quyidagilar bajariladi:
//   1. current_period_end yaqinlashgan oylik obunalarni topish
//   2. saqlangan karta token bo'lsa → avtomatik to'lov
//   3. token yo'q bo'lsa → Telegram/email eslatma + qayta to'lov linki
//   4. muddati o'tganlarni status=past_due qilish
//
// Xavfsizlik: Authorization: Bearer CRON_SECRET tekshiriladi.
// ============================================================================

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO(real): yuqoridagi qadamlarni Supabase bilan bajarish.
  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    note: "Skelet — Supabase ulangach obuna uzaytirish/eslatma faollashadi.",
  });
}
