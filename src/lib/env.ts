// Muhit sozlamalari va "qaysi xizmat ulangan" bayroqlari.
// Skelet bosqichida ko'p xizmatlar hali ulanmagan — kod bularga qarab
// DEMO (mock) rejim yoki real rejimga o'tadi.

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  // Video (Cloudflare R2 / kelajakda Bunny)
  r2PublicBase: process.env.R2_PUBLIC_BASE ?? "",
  videoSignSecret: process.env.VIDEO_SIGN_SECRET ?? "dev-insecure-secret-change-me",

  // To'lov provayderlari (kalitlar kelmaguncha mock rejim)
  paymeMerchantId: process.env.PAYME_MERCHANT_ID ?? "",
  paymeKey: process.env.PAYME_KEY ?? "",
  clickServiceId: process.env.CLICK_SERVICE_ID ?? "",
  clickSecret: process.env.CLICK_SECRET_KEY ?? "",
  uzumMerchantId: process.env.UZUM_MERCHANT_ID ?? "",
};

/** Supabase ulanganmi? Bo'lmasa DEMO rejim (cookie asosida). */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

/** To'lov provayderi ulanganmi? Bo'lmasa mock checkout. */
export function isPaymentConfigured(provider: "payme" | "click" | "uzum"): boolean {
  switch (provider) {
    case "payme":
      return Boolean(env.paymeMerchantId && env.paymeKey);
    case "click":
      return Boolean(env.clickServiceId && env.clickSecret);
    case "uzum":
      return Boolean(env.uzumMerchantId);
  }
}
