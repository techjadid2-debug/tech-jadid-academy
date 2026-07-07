import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// Payme (Paycom) Merchant API webhook — JSON-RPC 2.0.
// Skelet: struktura va metodlar joyida; real imzo tekshiruvi va DB yozuvi
// PAYME_KEY va Supabase ulangach yakunlanadi.
//
// Kerakli metodlar: CheckPerformTransaction, CreateTransaction,
// PerformTransaction, CancelTransaction, CheckTransaction, GetStatement.
//
// Xavfsizlik: Authorization: Basic base64("Paycom:PAYME_KEY") tekshiriladi,
// summa server narxi bilan solishtiriladi, provider_txn_id bo'yicha idempotent.
// ============================================================================

export async function POST(req: NextRequest) {
  // TODO(real): Authorization header'ni PAYME_KEY bilan tekshirish.
  // const auth = req.headers.get("authorization");

  let body: { method?: string; params?: unknown; id?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: -32700, message: "Parse error" } }, { status: 200 });
  }

  const { method, id } = body;

  switch (method) {
    case "CheckPerformTransaction":
      // TODO: buyurtma mavjudligi va summani tekshirish → { allow: true }
      return NextResponse.json({ jsonrpc: "2.0", id, result: { allow: true } });
    case "CreateTransaction":
      // TODO: payments'da pending yaratish (idempotent) → transaction holati
      return NextResponse.json({ jsonrpc: "2.0", id, result: { state: 1, create_time: Date.now() } });
    case "PerformTransaction":
      // TODO: payments=paid + grantAccess() (idempotent)
      return NextResponse.json({ jsonrpc: "2.0", id, result: { state: 2, perform_time: Date.now() } });
    case "CancelTransaction":
      // TODO: bekor qilish + kirishni yopish
      return NextResponse.json({ jsonrpc: "2.0", id, result: { state: -1, cancel_time: Date.now() } });
    case "CheckTransaction":
      return NextResponse.json({ jsonrpc: "2.0", id, result: { state: 0 } });
    default:
      return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
  }
}
