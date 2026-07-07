// Platformaning asosiy tip ta'riflari.
// Bu tiplar ham DB sxemasi, ham UI komponentlari uchun umumiy.

export type AccentColor = "blue" | "red" | "yellow" | "green";

export type LessonRowKind = "Nazariy" | "Amaliy" | "Natija";

export interface LessonRow {
  kind: LessonRowKind;
  text: string;
}

export interface Lesson {
  /** Global tartib raqami (1..16) */
  order: number;
  title: string;
  /** Preview darslar autentifikatsiyasiz ham ochiladi */
  isPreview: boolean;
  /** Bunny/R2 video kaliti (hozircha mock) */
  videoKey: string | null;
  /** Bepul preview uchun YouTube ID (ixtiyoriy) */
  youtubeId: string | null;
  durationSec: number;
  rows: LessonRow[];
}

export interface Module {
  order: number;
  code: string; // "MODUL 01"
  title: string;
  range: string; // "Darslar 1–3 · ..."
  accent: AccentColor;
  mist: boolean; // ochroq fon
  lessons: Lesson[];
}

export type PricingKind = "lifetime" | "monthly";

export interface PricingOption {
  kind: PricingKind;
  label: string;
  priceUzs: number;
  note: string;
}

export interface Course {
  slug: string;
  title: string;
  subtitle: string;
  year: string;
  modules: Module[];
  pricing: PricingOption[];
}

// ---- Foydalanuvchi / kirish ----

export type EnrollmentSource = "lifetime" | "monthly" | "admin";

export interface Enrollment {
  userId: string;
  courseSlug: string;
  source: EnrollmentSource;
  /** Oylik obuna uchun tugash sanasi; lifetime uchun null */
  expiresAt: string | null;
}

export type PaymentProvider = "payme" | "click" | "uzum";
export type PaymentStatus = "pending" | "paid" | "canceled";

export interface Payment {
  id: string;
  userId: string;
  amountUzs: number;
  provider: PaymentProvider;
  providerTxnId: string | null;
  status: PaymentStatus;
  kind: PricingKind;
  courseSlug: string;
  createdAt: string;
}
