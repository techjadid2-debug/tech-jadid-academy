// Platformaning asosiy tip ta'riflari.
// Bu tiplar ham DB sxemasi, ham UI komponentlari uchun umumiy.

export type AccentColor = "blue" | "red" | "yellow" | "green";

export type LessonRowKind = "Nazariy" | "Amaliy" | "Natija";

export interface LessonRow {
  kind: LessonRowKind;
  text: string;
}

export type LessonContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "callout"; title: string; text: string }
  | { type: "steps"; title: string; items: string[] }
  | { type: "prompt"; title: string; text: string }
  | { type: "task"; title: string; text: string; checklist: string[] };

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
  /** Dars sahifasida tartib bilan ko'rsatiladigan boyitilgan materiallar. */
  content?: LessonContentBlock[];
  /** "Sinab ko'ring" AI maydoni shu darsda ko'rsatiladimi (admin CMS orqali boshqariladi) */
  sandboxEnabled: boolean;
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

export type PricingKind = "lifetime" | "monthly" | "installment2";

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

export type EnrollmentSource = "lifetime" | "monthly" | "installment2" | "admin";

export interface Enrollment {
  userId: string;
  courseSlug: string;
  source: EnrollmentSource;
  /** Oylik obuna uchun tugash sanasi; lifetime/installment uchun null */
  expiresAt: string | null;
  /** "2 bo'lib to'lash"da 1-to'lovdan keyin ochilgan oxirgi dars tartibi; null = cheklovsiz (to'liq kirish) */
  unlockedThrough: number | null;
}

export type PaymentProvider = "payme" | "click" | "uzum" | "manual";
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

// ---- Ro'yxatdan o'tish arizasi ----

export type EnrollmentRequestStatus = "pending" | "approved" | "rejected";

export interface EnrollmentRequest {
  id: string;
  userId: string;
  courseSlug: string;
  status: EnrollmentRequestStatus;
  contact: string | null;
  createdAt: string;
}

// ---- Uy vazifasi ----

export type HomeworkStatus = "submitted" | "ai_graded" | "reviewed";

export interface HomeworkSubmission {
  id: string;
  userId: string;
  courseSlug: string;
  lessonOrder: number;
  contentText: string | null;
  linkUrl: string | null;
  filePath: string | null;
  fileName: string | null;
  status: HomeworkStatus;
  aiScore: number | null;
  aiFeedback: string | null;
  teacherScore: number | null;
  teacherFeedback: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
