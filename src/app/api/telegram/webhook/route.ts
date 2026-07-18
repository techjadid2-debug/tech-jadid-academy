import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  answerTelegramCallback,
  editTelegramMessage,
  isTelegramAdmin,
  removeTelegramKeyboard,
  sendTelegramMessage,
  sendTelegramPhoto,
  telegramConfigured,
  type TelegramMessage,
  type TelegramUpdate,
} from "@/lib/telegram";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getPaymentByOrderId, markPaymentPaid, updatePaymentTelegram } from "@/lib/payments/db";
import { COURSE_INTEREST_MESSAGE } from "@/lib/telegram-link";
import { decideRequestFromTelegram } from "@/lib/enrollment-requests";

export const runtime = "nodejs";

function approveKeyboard(paymentId: string) {
  return {
    inline_keyboard: [[
      { text: "✅ Tasdiqlash", callback_data: `manual:approve:${paymentId}` },
      { text: "❌ Rad etish", callback_data: `manual:reject:${paymentId}` },
    ]],
  };
}

function orderIdFromStart(text: string): string | null {
  const match = text.trim().match(/^\/start(?:@\w+)?\s+order_([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i);
  return match?.[1] ?? null;
}

function isCourseInterestStart(text: string): boolean {
  return /^\/start(?:@\w+)?\s+kursga_oqimoqchiman$/i.test(text.trim());
}

function messageReceipt(message: TelegramMessage): { fileId: string | null; text: string } {
  const photo = message.photo?.at(-1);
  return {
    fileId: photo?.file_id ?? null,
    text: (message.caption ?? message.text ?? "").trim(),
  };
}

async function findPendingPaymentForChat(chatId: number) {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin
    .from("payments")
    .select("id")
    .eq("provider", "manual")
    .eq("telegram_chat_id", chatId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ? getPaymentByOrderId(String(data.id)) : null;
}

async function notifyAdmins(paymentId: string, message: TelegramMessage, fileId: string | null, receiptText: string) {
  const payment = await getPaymentByOrderId(paymentId);
  if (!payment) return;
  const summary = [
    "🧾 Yangi manual to'lov",
    `Buyurtma: ${payment.id}`,
    `Kurs: ${payment.courseSlug ?? "—"}`,
    `Summa: ${new Intl.NumberFormat("uz-UZ").format(payment.amountUzs)} so'm`,
    `Foydalanuvchi: ${payment.userId}`,
    receiptText ? `Izoh: ${receiptText.slice(0, 700)}` : "Izoh: —",
  ].join("\n");

  await Promise.all(env.telegramAdminIds.map((adminId) =>
    fileId
      ? sendTelegramPhoto(adminId, fileId, summary, approveKeyboard(payment.id))
      : sendTelegramMessage(adminId, summary, approveKeyboard(payment.id)),
  ));
}

async function handleMessage(message: TelegramMessage) {
  const chatId = message.chat.id;
  if (message.text && isCourseInterestStart(message.text)) {
    const sender = message.from?.username ? `@${message.from.username}` : message.from?.first_name ?? String(chatId);
    await Promise.all([
      sendTelegramMessage(chatId, `${COURSE_INTEREST_MESSAGE}\n\nTez orada siz bilan bog'lanamiz.`),
      ...env.telegramAdminIds.map((adminId) => sendTelegramMessage(adminId, `Yangi kurs so'rovi\nFoydalanuvchi: ${sender}\nXabar: ${COURSE_INTEREST_MESSAGE}`)),
    ]);
    return;
  }
  const startOrderId = message.text ? orderIdFromStart(message.text) : null;

  if (startOrderId) {
    const payment = await getPaymentByOrderId(startOrderId);
    if (!payment || payment.provider !== "manual" || payment.status !== "pending") {
      await sendTelegramMessage(chatId, "Bu buyurtma topilmadi yoki allaqachon ko'rib chiqilgan.");
      return;
    }
    await updatePaymentTelegram(payment.id, chatId, {
      chat_id: chatId,
      username: message.from?.username ?? null,
      linked_at: new Date().toISOString(),
    });
    const admin = createSupabaseAdmin();
    if (admin) {
      await admin.from("profiles").update({ telegram_chat_id: chatId }).eq("id", payment.userId);
    }
    await sendTelegramMessage(
      chatId,
      `Buyurtma qabul qilindi: ${payment.id}\n\nTo'lov chekini rasm yoki izoh ko'rinishida yuboring. Admin tasdiqlagach kurs ochiladi.`,
    );
    return;
  }

  const receipt = messageReceipt(message);
  if (!receipt.fileId && !receipt.text) {
    await sendTelegramMessage(chatId, "Avval saytdagi buyurtma havolasi orqali botni ishga tushiring.");
    return;
  }

  const payment = await findPendingPaymentForChat(chatId);
  if (!payment) {
    await sendTelegramMessage(chatId, "Faol buyurtma topilmadi. Saytdan yangi buyurtma boshlang.");
    return;
  }

  await updatePaymentTelegram(payment.id, chatId, {
    receipt_file_id: receipt.fileId,
    receipt_text: receipt.text.slice(0, 2000),
    message_id: message.message_id,
    received_at: new Date().toISOString(),
  });
  await sendTelegramMessage(chatId, "Chek qabul qilindi. Admin tasdig'ini kuting.");
  await notifyAdmins(payment.id, message, receipt.fileId, receipt.text);
}

async function handleEnrollmentCallback(callback: NonNullable<TelegramUpdate["callback_query"]>, requestId: string, approve: boolean) {
  if (!isTelegramAdmin(callback.from.id)) {
    await answerTelegramCallback(callback.id, "Sizda bu amal uchun ruxsat yo'q.");
    return;
  }
  const result = await decideRequestFromTelegram(requestId, approve);
  if (!result) {
    await answerTelegramCallback(callback.id, "Ariza topilmadi yoki allaqachon ko'rib chiqilgan.");
    return;
  }
  await answerTelegramCallback(callback.id, approve ? "Tasdiqlandi." : "Rad etildi.");
  if (callback.message) {
    const label = approve ? "✅ TASDIQLANDI" : "❌ RAD ETILDI";
    await editTelegramMessage(
      callback.message.chat.id,
      callback.message.message_id,
      `${label}\n\n${callback.message.text ?? callback.message.caption ?? "Ro'yxatdan o'tish arizasi"}`,
    );
    await removeTelegramKeyboard(callback.message.chat.id, callback.message.message_id);
  }
}

async function handleCallback(update: TelegramUpdate) {
  const callback = update.callback_query;
  if (!callback) return;
  const data = callback.data ?? "";

  const enrollMatch = data.match(/^enroll:(approve|reject):([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i);
  if (enrollMatch) {
    await handleEnrollmentCallback(callback, enrollMatch[2], enrollMatch[1].toLowerCase() === "approve");
    return;
  }

  const match = data.match(/^manual:(approve|reject):([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i);
  if (!match) {
    await answerTelegramCallback(callback.id, "Noma'lum amal");
    return;
  }
  if (!isTelegramAdmin(callback.from.id)) {
    await answerTelegramCallback(callback.id, "Sizda bu amal uchun ruxsat yo'q.");
    return;
  }

  const payment = await getPaymentByOrderId(match[2]);
  if (!payment || payment.provider !== "manual") {
    await answerTelegramCallback(callback.id, "Buyurtma topilmadi.");
    return;
  }
  if (payment.status !== "pending") {
    await answerTelegramCallback(callback.id, "Bu buyurtma allaqachon ko'rib chiqilgan.");
    return;
  }

  const action = match[1].toLowerCase();
  if (action === "reject") {
    const admin = createSupabaseAdmin();
    if (!admin) return;
    const { error } = await admin.from("payments").update({
      status: "canceled",
      raw: { ...payment.raw, manual: { ...(payment.raw.manual as object | undefined), rejected_by: callback.from.id, rejected_at: new Date().toISOString() } },
    }).eq("id", payment.id).eq("status", "pending");
    if (error) {
      console.error("[telegram] manual payment rejection failed", error);
      await answerTelegramCallback(callback.id, "Server xatosi. Qayta urinib ko'ring.");
      return;
    }
    if (payment.telegramChatId) await sendTelegramMessage(payment.telegramChatId, "To'lov tasdiqlanmadi. Iltimos, admin bilan bog'laning.");
    await answerTelegramCallback(callback.id, "Buyurtma rad etildi.");
  } else {
    try {
      await markPaymentPaid(payment, {
        raw: { ...payment.raw, manual: { ...(payment.raw.manual as object | undefined), approved_by: callback.from.id, approved_at: new Date().toISOString() } },
      });
      if (payment.telegramChatId) await sendTelegramMessage(payment.telegramChatId, "✅ To'lov tasdiqlandi! Kursga kirish ochildi: /dashboard");
      await answerTelegramCallback(callback.id, "To'lov tasdiqlandi.");
    } catch (error) {
      console.error("[telegram] manual payment approval failed", error);
      await answerTelegramCallback(callback.id, "Server xatosi. Qayta urinib ko'ring.");
      return;
    }
  }

  if (callback.message) {
    const label = action === "approve" ? "✅ TASDIQLANDI" : "❌ RAD ETILDI";
    await editTelegramMessage(callback.message.chat.id, callback.message.message_id, `${label}\n\n${callback.message.text ?? callback.message.caption ?? "Manual payment"}`);
    await removeTelegramKeyboard(callback.message.chat.id, callback.message.message_id);
  }
}

export async function POST(req: NextRequest) {
  if (!telegramConfigured() || !env.telegramWebhookSecret) {
    return NextResponse.json({ error: "Telegram webhook sozlanmagan" }, { status: 503 });
  }
  if (req.headers.get("x-telegram-bot-api-secret-token") !== env.telegramWebhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (update.callback_query) await handleCallback(update);
  else if (update.message) await handleMessage(update.message);
  return NextResponse.json({ ok: true });
}
