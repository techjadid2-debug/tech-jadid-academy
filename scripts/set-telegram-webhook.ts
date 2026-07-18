const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!token || !appUrl || !secret) {
  throw new Error("TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_APP_URL va TELEGRAM_WEBHOOK_SECRET kerak.");
}

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    url: `${appUrl}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  }),
});

const result = await response.json();
if (!response.ok || !result.ok) throw new Error(JSON.stringify(result));
console.log("Telegram webhook o'rnatildi:", result);

export {};
