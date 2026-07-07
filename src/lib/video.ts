import "server-only";
import crypto from "node:crypto";
import { env } from "./env";

// ============================================================================
// Video kirish nazorati — imzolangan (signed), muddati tugaydigan URL.
//
// Skelet: Cloudflare R2/Bunny hali ulanmagan bo'lsa, URL null qaytadi va
// player "video hali yuklanmagan" holatini ko'rsatadi. Ulanganda bu funksiya
// haqiqiy signed URL beradi.
//
// Xavfsizlik qatlamlari (reja 9-bo'lim): signed URL (muddat + imzo) +
// watermark (quyida) + domen qulfi (deploy sozlamasi) + seans cheklovi.
// ============================================================================

const TTL_SECONDS = 2 * 60 * 60; // 2 soat

export interface SignedVideo {
  /** O'ynatiladigan URL yoki null (video hali yuklanmagan) */
  url: string | null;
  expiresAt: number;
}

/**
 * Foydalanuvchi uchun video kalitiga imzolangan URL yaratadi.
 * Imzo foydalanuvchiga va muddatga bog'langan — link tarqalsa ham
 * boshqa vaqtda/kontekstda ishlamaydi.
 */
export function signVideoUrl(videoKey: string | null, userId: string): SignedVideo {
  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS;

  if (!videoKey || !env.r2PublicBase) {
    return { url: null, expiresAt };
  }

  const token = crypto
    .createHmac("sha256", env.videoSignSecret)
    .update(`${videoKey}:${userId}:${expiresAt}`)
    .digest("hex")
    .slice(0, 32);

  const url = `${env.r2PublicBase}/${videoKey}.m3u8?u=${encodeURIComponent(userId)}&e=${expiresAt}&t=${token}`;
  return { url, expiresAt };
}

/** Imzoni tekshiradi (video-serving proxy tomonida ishlatiladi). */
export function verifyVideoToken(
  videoKey: string,
  userId: string,
  expiresAt: number,
  token: string,
): boolean {
  if (expiresAt < Math.floor(Date.now() / 1000)) return false;
  const expected = crypto
    .createHmac("sha256", env.videoSignSecret)
    .update(`${videoKey}:${userId}:${expiresAt}`)
    .digest("hex")
    .slice(0, 32);
  // Doimiy vaqtli taqqoslash
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/** Watermark uchun ko'rsatiladigan matn (foydalanuvchini identifikatsiya qiladi). */
export function watermarkText(user: { phone?: string; email?: string; id: string }): string {
  return user.phone || user.email || user.id;
}
