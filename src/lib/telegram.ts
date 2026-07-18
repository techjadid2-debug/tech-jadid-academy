import "server-only";
import { env } from "@/lib/env";

type TelegramResult<T> = { ok: boolean; result?: T; description?: string };

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  chat: { id: number; type?: string };
  from?: TelegramUser;
  text?: string;
  caption?: string;
  photo?: { file_id: string; width: number; height: number }[];
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramUser;
    data?: string;
    message?: TelegramMessage;
  };
}

export function telegramConfigured(): boolean {
  return Boolean(env.telegramBotToken && env.telegramBotUsername && env.telegramAdminIds.length > 0);
}

export function telegramStartUrl(orderId: string): string | null {
  if (!env.telegramBotUsername) return null;
  return `https://t.me/${env.telegramBotUsername}?start=order_${encodeURIComponent(orderId)}`;
}

export function isTelegramAdmin(userId: number): boolean {
  return env.telegramAdminIds.includes(String(userId));
}

async function callTelegram<T>(method: string, body: Record<string, unknown>): Promise<T | null> {
  if (!env.telegramBotToken) return null;
  try {
    const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const result = (await response.json()) as TelegramResult<T>;
    if (!response.ok || !result.ok) {
      console.error("[telegram] API failed", method, result.description);
      return null;
    }
    return result.result ?? null;
  } catch (error) {
    console.error("[telegram] API request failed", method, error);
    return null;
  }
}

export function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: Record<string, unknown>,
) {
  return callTelegram("sendMessage", {
    chat_id: chatId,
    text,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export function sendTelegramPhoto(
  chatId: number | string,
  photo: string,
  caption: string,
  replyMarkup?: Record<string, unknown>,
) {
  return callTelegram("sendPhoto", {
    chat_id: chatId,
    photo,
    caption,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export function answerTelegramCallback(callbackQueryId: string, text: string) {
  return callTelegram("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

export function editTelegramMessage(
  chatId: number | string,
  messageId: number,
  text: string,
) {
  return callTelegram("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
  });
}

export function removeTelegramKeyboard(chatId: number | string, messageId: number) {
  return callTelegram("editMessageReplyMarkup", {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: { inline_keyboard: [] },
  });
}
