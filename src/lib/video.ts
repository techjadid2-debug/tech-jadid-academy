import "server-only";
import crypto from "node:crypto";
import { env, isVideoConfigured } from "./env";

// ============================================================================
// Video kirish nazorati — imzolangan (signed), muddati tugaydigan URL.
//
// Video to'g'ridan-to'g'ri R2'dan emas, bizning /api/video/... proxy'imizdan
// o'ynaydi: proxy imzoni tekshiradi, m3u8 ichidagi segment linklarga ham shu
// imzoni qo'shadi. Link tarqalsa ham muddati (2 soat) tugagach ishlamaydi.
//
// R2 layout konvensiyasi (README'da ham): har dars HLS papkada —
//   <R2_PUBLIC_BASE>/<videoKey>/index.m3u8  (+ segmentlar shu papkada)
//
// Xavfsizlik qatlamlari: signed URL (muddat + imzo) + watermark (quyida) +
// domen qulfi (deploy sozlamasi) + kelajakda seans cheklovi.
// ============================================================================

const TTL_SECONDS = 2 * 60 * 60; // 2 soat

export interface SignedVideo {
  /** O'ynatiladigan URL yoki null (video hali yuklanmagan) */
  url: string | null;
  expiresAt: number;
}

function tokenFor(videoKey: string, userId: string, expiresAt: number): string {
  return crypto
    .createHmac("sha256", env.videoSignSecret)
    .update(`${videoKey}:${userId}:${expiresAt}`)
    .digest("hex")
    .slice(0, 32);
}

/** Imzo query-satri — playlist va segmentlar uchun bir xil (videoKey darajasida). */
export function videoTokenQuery(videoKey: string, userId: string, expiresAt: number): string {
  const token = tokenFor(videoKey, userId, expiresAt);
  return `u=${encodeURIComponent(userId)}&e=${expiresAt}&t=${token}`;
}

/**
 * Foydalanuvchi uchun video kalitiga imzolangan URL yaratadi.
 * Imzo foydalanuvchiga va muddatga bog'langan — link tarqalsa ham
 * boshqa vaqtda/kontekstda ishlamaydi.
 */
export function signVideoUrl(videoKey: string | null, userId: string): SignedVideo {
  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS;

  if (!videoKey || !isVideoConfigured) {
    return { url: null, expiresAt };
  }

  const url = `/api/video/${videoKey}/index.m3u8?${videoTokenQuery(videoKey, userId, expiresAt)}`;
  return { url, expiresAt };
}

/** Imzoni tekshiradi (video-serving proxy tomonida ishlatiladi). */
export function verifyVideoToken(
  videoKey: string,
  userId: string,
  expiresAt: number,
  token: string,
): boolean {
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;
  const expected = tokenFor(videoKey, userId, expiresAt);
  if (token.length !== expected.length) return false;
  // Doimiy vaqtli taqqoslash
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/** Watermark uchun maxfiy kontaktni chiqarmaydigan, barqaror maxsus o'quvchi ID. */
export function watermarkText(user: { id: string }): string {
  const code = crypto.createHash("sha256").update(user.id).digest("hex").slice(0, 8).toUpperCase();
  return `TECH JADID · TJ-${code}`;
}
