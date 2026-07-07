import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// Uzum (Apelsin) checkout webhook.
// Skelet: struktura joyida; imzo/summani tekshirish va DB yozuvi
// UZUM kalitlari va Supabase ulangach yakunlanadi.
// Idempotency: provider transaction id bo'yicha bir marta ishlov.
// ============================================================================

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "FAILED", message: "Bad request" }, { status: 200 });
  }

  // TODO(real): imzo tekshiruvi + summani server narxi bilan solishtirish.
  // TODO(real): to'lov holatiga qarab payments=paid + grantAccess() (idempotent).
  void body;

  return NextResponse.json({ status: "OK" });
}
