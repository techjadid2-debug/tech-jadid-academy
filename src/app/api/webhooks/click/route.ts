import { NextRequest, NextResponse } from "next/server";

// ============================================================================
// Click webhook — ikki bosqichli: Prepare (action=0) va Complete (action=1).
// Skelet: MD5 imzo (sign_string) tekshiruvi va DB yozuvi CLICK_SECRET_KEY
// va Supabase ulangach yakunlanadi.
//
// sign_string = md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id
//                   + [merchant_prepare_id] + amount + action + sign_time)
// Idempotency: click_trans_id bo'yicha bir marta ishlov.
// ============================================================================

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const action = String(form.get("action") ?? "");

  // TODO(real): sign_string ni qayta hisoblab, form.get("sign_string") bilan solishtirish.
  // Mos kelmasa → { error: -1, error_note: "SIGN CHECK FAILED" }

  if (action === "0") {
    // Prepare — buyurtma va summani tekshirish
    // TODO: payments pending topish/yaratish
    return NextResponse.json({
      error: 0,
      error_note: "Success",
      merchant_prepare_id: Date.now(),
    });
  }

  if (action === "1") {
    // Complete — to'lovni yakunlash
    // TODO: payments=paid + grantAccess() (idempotent)
    return NextResponse.json({
      error: 0,
      error_note: "Success",
      merchant_confirm_id: Date.now(),
    });
  }

  return NextResponse.json({ error: -3, error_note: "Action not found" });
}
