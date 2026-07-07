import type { PaymentProvider, PricingKind } from "@/lib/types";
import { isPaymentConfigured } from "@/lib/env";

// ============================================================================
// To'lov provayderi abstraksiyasi.
//
// Umumiy oqim (reja 5-bo'lim):
//   1. checkout yaratiladi → pending payment
//   2. foydalanuvchi provayder sahifasiga yo'naltiriladi
//   3. provayder webhook yuboradi → imzo tekshiruvi + idempotency
//   4. payments=paid → grantAccess()
//
// Skelet: real kalitlar yo'q bo'lsa, mock checkout sahifasiga yo'naltiramiz
// (/checkout) — u yerda "demo tasdiqlash" to'liq oqimni yakunlaydi.
// ============================================================================

export interface CheckoutRequest {
  provider: PaymentProvider;
  userId: string;
  courseSlug: string;
  kind: PricingKind;
  amountUzs: number;
}

export interface CheckoutResult {
  /** Foydalanuvchi yo'naltiriladigan URL */
  redirectUrl: string;
  /** Bizning tomondagi buyurtma raqami */
  orderId: string;
  /** true bo'lsa — haqiqiy provayder, false — demo */
  live: boolean;
}

export const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  payme: "Payme",
  click: "Click",
  uzum: "Uzum",
};

export function newOrderId(): string {
  return "ord_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * Checkout yaratadi. Real rejimda bu yerda har provayderning
 * Merchant API'si chaqirilib, to'lov sahifasi URL'i qaytariladi.
 */
export function createCheckout(req: CheckoutRequest): CheckoutResult {
  const orderId = newOrderId();

  if (isPaymentConfigured(req.provider)) {
    // TODO(real): provayderga xos checkout URL qurish.
    //  - Payme: base64(m=MERCHANT;ac.order_id=ORDER;a=AMOUNT) → checkout.paycom.uz
    //  - Click:  services.click.uz/services/pay?service_id=...&merchant_id=...&amount=...
    //  - Uzum:   Apelsin checkout create API
    // Hozircha struktura tayyor, lekin real URL qurish kalitlar bilan yoziladi.
  }

  // DEMO rejim — mock checkout sahifasi.
  const params = new URLSearchParams({
    provider: req.provider,
    slug: req.courseSlug,
    kind: req.kind,
    amount: String(req.amountUzs),
    order: orderId,
  });
  return {
    redirectUrl: `/checkout?${params.toString()}`,
    orderId,
    live: false,
  };
}
