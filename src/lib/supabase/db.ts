import "server-only";
import { cache } from "react";
import { createSupabaseAdmin } from "./admin";

// ============================================================================
// DB lookup helper'lari — kurs/dars slug↔uuid moslashtiruvi.
// Katalog mazmuni (course-data.ts) statik "order" (1..16) ishlatadi;
// DB esa uuid ishlatadi. Bu yerda ikkisi bog'lanadi.
// `cache` bir so'rov ichida takroriy DB chaqiruvini oldini oladi.
// ============================================================================

/** Kurs slug → uuid. Topilmasa null. */
export const getCourseId = cache(async (slug: string): Promise<string | null> => {
  const admin = createSupabaseAdmin();
  if (!admin) return null;
  const { data } = await admin.from("courses").select("id").eq("slug", slug).maybeSingle();
  return (data?.id as string | undefined) ?? null;
});

/** (kurs slug, global dars tartibi 1..16) → lesson uuid. Topilmasa null. */
export const getLessonId = cache(
  async (slug: string, order: number): Promise<string | null> => {
    const admin = createSupabaseAdmin();
    if (!admin) return null;
    const { data } = await admin
      .from("lessons")
      .select("id, modules!inner(courses!inner(slug))")
      .eq("order", order)
      .eq("modules.courses.slug", slug)
      .maybeSingle();
    return (data?.id as string | undefined) ?? null;
  },
);
