import "server-only";
import { cache } from "react";
import type { AccentColor, Course, Lesson, LessonContentBlock, LessonRow, Module, PricingKind, PricingOption } from "./types";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabasePublic } from "@/lib/supabase/public";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCourse as getCourseDemo } from "@/lib/course-data";

// ============================================================================
// Kontent o'qish — dual-mode (access.ts andozasi bo'yicha).
//
// REAL rejim: Supabase `courses`/`pricing_options`/`modules`/`lessons` jadvallari
// (o'qish uchun service role — kontent hali admin CMS orqali to'liq boshqarilmagani
// uchun RLS'ga bog'liq emas, xuddi boshqa dual-mode modullar kabi).
// DEMO rejim: `course-data.ts`dagi statik `AI_FOUNDATIONS`.
//
// `getLesson`/`allLessons`/`formatUzs` (course-data.ts) allaqachon Course obyekti
// ustida sof (I/O'siz) ishlaydi — manbasidan qat'i nazar bir xil ishlaydi, shuning
// uchun ularning alohida "Async" versiyasi shart emas.
// ============================================================================

/** Kurs slug → to'liq Course (modullar + darslar + narxlar bilan). Topilmasa undefined. */
export const getCourseAsync = cache(async (slug: string): Promise<Course | undefined> => {
  if (!isSupabaseConfigured) return getCourseDemo(slug);
  // Lokal ishga tushirishda yoki Supabase hali seed qilinmagan bo'lsa ham kurs
  // sahifasi 404 bo'lmasin: statik dastur ishonchli fallback hisoblanadi.
  return (await getCourseDb(slug)) ?? getCourseDemo(slug);
});

interface DbLessonRow {
  order: number;
  title: string;
  is_preview: boolean;
  video_key?: string | null;
  youtube_id: string | null;
  duration_sec: number;
  rows: unknown;
  content: unknown;
  sandbox_enabled: boolean;
}

interface DbModuleRow {
  order: number;
  code: string | null;
  title: string;
  range_text: string | null;
  accent: string | null;
  lessons: DbLessonRow[];
}

interface DbPricingRow {
  kind: string;
  label: string;
  price_uzs: number;
  note: string | null;
}

interface DbCourseRow {
  slug: string;
  title: string;
  subtitle: string | null;
  pricing_options: DbPricingRow[];
  modules: DbModuleRow[];
}

async function getCourseDb(slug: string): Promise<Course | undefined> {
  // Public client may not select video_key after the RLS hardening migration.
  // Service role is used when available; otherwise the catalogue still works
  // with a safe video placeholder.
  const admin = createSupabaseAdmin();
  const supabase = admin ?? createSupabasePublic();
  if (!supabase) return undefined;

  const lessonFields = admin
    ? "order, title, is_preview, video_key, youtube_id, duration_sec, rows, content, sandbox_enabled"
    : "order, title, is_preview, youtube_id, duration_sec, rows, sandbox_enabled";

  const { data, error } = await supabase
    .from("courses")
    .select(
      `slug, title, subtitle,
       pricing_options ( kind, label, price_uzs, note ),
       modules ( order, code, title, range_text, accent,
         lessons ( ${lessonFields} ) )`,
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("[course] getCourseDb failed", error);
    return undefined;
  }
  if (!data) return undefined;

  const row = data as unknown as DbCourseRow;

  const staticCourse = getCourseDemo(slug);
  const modules: Module[] = [...row.modules]
    .sort((a, b) => a.order - b.order)
    .map((m) => ({
      order: m.order,
      code: m.code ?? "",
      title: m.title,
      range: m.range_text ?? "",
      accent: (m.accent as AccentColor) ?? "blue",
      // Zebra-fon: toq modul — och, juft modul — mist (course-data.ts'dagi naqsh bilan bir xil).
      mist: m.order % 2 === 0,
      lessons: [...m.lessons]
        .sort((a, b) => a.order - b.order)
        .map(
          (l): Lesson => ({
            order: l.order,
            title: l.title,
            isPreview: l.is_preview,
            videoKey: l.video_key ?? null,
            youtubeId: l.youtube_id,
            durationSec: l.duration_sec,
            rows: Array.isArray(l.rows) ? l.rows : [],
            content: Array.isArray(l.content) && l.content.length > 0
              ? l.content as LessonContentBlock[]
              : staticCourse?.modules.flatMap((module) => module.lessons)
                  .find((lesson) => lesson.order === l.order)?.content,
            sandboxEnabled: l.sandbox_enabled,
          }),
        ),
    }));

  const pricing: PricingOption[] = row.pricing_options.map((p) => ({
    kind: p.kind as PricingKind,
    label: p.label,
    priceUzs: p.price_uzs,
    note: p.note ?? "",
  }));

  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    // "year" DB'da kuzatilmaydi (faqat kosmetik matn) — statik kursdan olamiz.
    year: staticCourse?.year ?? "2026",
    modules,
    pricing,
  };
}

// ============================================================================
// Admin CMS o'qish — DB id'lari va savollar (is_correct bilan) bo'lgan boyitilgan
// ko'rinish. FAQAT admin tekshiruvidan keyin chaqiriladi (service role o'qiydi —
// quiz_options.is_correct anon RLS'da ataylab yopiq).
// ============================================================================

export interface AdminQuizOption {
  id: string;
  order: number;
  text: string;
  isCorrect: boolean;
}

export interface AdminQuizQuestion {
  id: string;
  order: number;
  prompt: string;
  explanation: string | null;
  points: number;
  options: AdminQuizOption[];
}

export interface AdminLesson {
  id: string;
  order: number;
  title: string;
  isPreview: boolean;
  videoKey: string | null;
  youtubeId: string | null;
  durationSec: number;
  sandboxEnabled: boolean;
  rows: LessonRow[];
  content: LessonContentBlock[];
  quiz: AdminQuizQuestion[];
}

export interface AdminModule {
  id: string;
  order: number;
  code: string;
  title: string;
  accent: AccentColor;
  lessons: AdminLesson[];
}

export interface AdminPricing {
  id: string;
  kind: PricingKind;
  label: string;
  priceUzs: number;
  note: string;
}

export interface AdminCourse {
  id: string;
  slug: string;
  title: string;
  pricing: AdminPricing[];
  modules: AdminModule[];
}

/** Admin panel uchun kurs (id'lar + savollar bilan). Supabase/service key yo'q bo'lsa null. */
export async function getCourseAdmin(slug: string): Promise<AdminCourse | null> {
  const admin = createSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
    .from("courses")
    .select(
      `id, slug, title,
       pricing_options ( id, kind, label, price_uzs, note ),
       modules ( id, order, code, title, accent,
         lessons ( id, order, title, is_preview, video_key, youtube_id, duration_sec, rows, content, sandbox_enabled,
           quiz_questions ( id, order, prompt, explanation, points,
             quiz_options ( id, order, text, is_correct ) ) ) )`,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[course] getCourseAdmin failed", error);
    return null;
  }
  if (!data) return null;

  interface Row {
    id: string; slug: string; title: string;
    pricing_options: { id: string; kind: string; label: string; price_uzs: number; note: string | null }[];
    modules: {
      id: string; order: number; code: string | null; title: string; accent: string | null;
      lessons: {
        id: string; order: number; title: string; is_preview: boolean; video_key: string | null;
        youtube_id: string | null; duration_sec: number; rows: unknown; content: unknown; sandbox_enabled: boolean;
        quiz_questions: {
          id: string; order: number; prompt: string; explanation: string | null; points: number;
          quiz_options: { id: string; order: number; text: string; is_correct: boolean }[];
        }[];
      }[];
    }[];
  }
  const row = data as unknown as Row;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    pricing: row.pricing_options.map((p) => ({
      id: p.id,
      kind: p.kind as PricingKind,
      label: p.label,
      priceUzs: p.price_uzs,
      note: p.note ?? "",
    })),
    modules: [...row.modules]
      .sort((a, b) => a.order - b.order)
      .map((m) => ({
        id: m.id,
        order: m.order,
        code: m.code ?? "",
        title: m.title,
        accent: (m.accent as AccentColor) ?? "blue",
        lessons: [...m.lessons]
          .sort((a, b) => a.order - b.order)
          .map((l) => ({
            id: l.id,
            order: l.order,
            title: l.title,
            isPreview: l.is_preview,
            videoKey: l.video_key,
            youtubeId: l.youtube_id,
            durationSec: l.duration_sec,
            sandboxEnabled: l.sandbox_enabled,
            rows: Array.isArray(l.rows) ? (l.rows as LessonRow[]) : [],
            content: Array.isArray(l.content) ? (l.content as LessonContentBlock[]) : [],
            quiz: [...l.quiz_questions]
              .sort((a, b) => a.order - b.order)
              .map((q) => ({
                id: q.id,
                order: q.order,
                prompt: q.prompt,
                explanation: q.explanation,
                points: q.points,
                options: [...q.quiz_options]
                  .sort((a, b) => a.order - b.order)
                  .map((o) => ({ id: o.id, order: o.order, text: o.text, isCorrect: o.is_correct })),
              })),
          })),
      })),
  };
}
