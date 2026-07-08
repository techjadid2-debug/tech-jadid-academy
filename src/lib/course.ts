import "server-only";
import { cache } from "react";
import type { AccentColor, Course, Lesson, Module, PricingKind, PricingOption } from "./types";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabasePublic } from "@/lib/supabase/public";
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
  return getCourseDb(slug);
});

interface DbLessonRow {
  order: number;
  title: string;
  is_preview: boolean;
  video_key: string | null;
  youtube_id: string | null;
  duration_sec: number;
  rows: unknown;
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
  const supabase = createSupabasePublic();
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from("courses")
    .select(
      `slug, title, subtitle,
       pricing_options ( kind, label, price_uzs, note ),
       modules ( order, code, title, range_text, accent,
         lessons ( order, title, is_preview, video_key, youtube_id, duration_sec, rows, sandbox_enabled ) )`,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[course] getCourseDb failed", error);
    return undefined;
  }
  if (!data) return undefined;

  const row = data as unknown as DbCourseRow;

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
            videoKey: l.video_key,
            youtubeId: l.youtube_id,
            durationSec: l.duration_sec,
            rows: Array.isArray(l.rows) ? l.rows : [],
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
    // "year" DB'da hali kuzatilmaydi (faqat kosmetik matn) — statik fallback.
    year: "2026",
    modules,
    pricing,
  };
}
