import "server-only";

// Muhit sozlamalari va "qaysi xizmat ulangan" bayroqlari.
// Ko'p xizmatlar kalitlari hali qo'yilmagan bo'lishi mumkin — kod bularga qarab
// DEMO (mock) rejim yoki real rejimga o'tadi.

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  /** Sayt bazaviy URL'i (to'lovdan qaytish linklari uchun), masalan https://techjadid.uz */
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, ""),
  paymentCardNumber: (process.env.PAYMENT_CARD_NUMBER ?? "").trim(),
  paymentCardHolder: (process.env.PAYMENT_CARD_HOLDER ?? "").trim(),
  paymentTelegramUrl: (process.env.PAYMENT_TELEGRAM_URL ?? "").trim(),

  // Video (Cloudflare R2 / kelajakda Bunny)
  r2PublicBase: (process.env.R2_PUBLIC_BASE ?? "").replace(/\/$/, ""),
  videoSignSecret: process.env.VIDEO_SIGN_SECRET ?? "",

  // Bepul manual to'lov: Telegram bot + admin tasdig'i.
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramBotUsername: (process.env.TELEGRAM_BOT_USERNAME ?? "").replace(/^@/, ""),
  telegramAdminIds: (process.env.TELEGRAM_ADMIN_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean),
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET ?? "",

  // Cron himoyasi
  cronSecret: process.env.CRON_SECRET ?? "",

  // AI sandbox ("Sinab ko'ring") — Vercel AI Gateway orqali.
  // Vercel'da OIDC token avtomatik bor; lokalda `vercel env pull` yoki API kalit.
  aiGatewayKey: process.env.AI_GATEWAY_API_KEY ?? "",
  sandboxModel: process.env.AI_SANDBOX_MODEL ?? "anthropic/claude-haiku-4.5",
};

/** Supabase ulanganmi? Bo'lmasa DEMO rejim (cookie asosida). */
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

/** Production'da demo checkout hech qachon kursni avtomatik ochmasligi kerak. */
export const isManualSalesConfigured = Boolean(
  env.paymentCardNumber && env.paymentCardHolder && env.paymentTelegramUrl,
);

/** Video hosting (R2) ulanganmi? Bo'lmasa player placeholder ko'rsatadi. */
export const isVideoConfigured = Boolean(
  env.r2PublicBase && env.videoSignSecret.length >= 32,
);

/** AI Gateway autentifikatsiyasi bormi (API kalit yoki Vercel OIDC)? */
export const isSandboxConfigured = Boolean(
  env.aiGatewayKey || process.env.VERCEL_OIDC_TOKEN,
);

export const isManualPaymentConfigured = Boolean(
  isSupabaseConfigured &&
    env.telegramBotToken &&
    env.telegramBotUsername &&
    env.telegramAdminIds.length > 0 &&
    env.telegramWebhookSecret,
);

/** Yangi checkout yaratish uchun karta va chek yuborish kanali tayyormi? */
export const isCheckoutConfigured = Boolean(
  env.paymentCardNumber &&
    env.paymentCardHolder &&
    (env.paymentTelegramUrl || isManualPaymentConfigured),
);
