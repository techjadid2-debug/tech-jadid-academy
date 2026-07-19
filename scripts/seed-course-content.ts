/**
 * Bir martalik skript: src/lib/course-data.ts'dagi AI_FOUNDATIONS'ni yagona manba
 * sifatida olib, Supabase'dagi `lessons.rows` (Nazariy/Amaliy/Natija) va
 * `lessons.sandbox_enabled` ustunlarini to'ldiradi.
 *
 * Ishga tushirish: npx tsx --env-file=.env.local scripts/seed-course-content.ts
 *
 * Talab: supabase/migrations/0001_init.sql, 0002_content_and_gamification.sql
 * va supabase/seed.sql avval qo'llangan bo'lishi kerak (kurs/modul/dars metadata).
 */
import { createClient } from "@supabase/supabase-js";
import { AI_FOUNDATIONS } from "../src/lib/course-data";
import { withLessonMaterials } from "../src/lib/lesson-materials";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY topilmadi (.env.local)");
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: course, error: courseErr } = await admin
    .from("courses")
    .select("id")
    .eq("slug", AI_FOUNDATIONS.slug)
    .maybeSingle();
  if (courseErr || !course) {
    throw new Error(`Kurs topilmadi: ${AI_FOUNDATIONS.slug}. Avval supabase/seed.sql'ni qo'llang.`);
  }

  const { data: modules, error: modulesErr } = await admin
    .from("modules")
    .select("id, order")
    .eq("course_id", course.id);
  if (modulesErr || !modules) throw new Error("Modullarni o'qib bo'lmadi");

  const moduleIdByOrder = new Map(modules.map((m) => [m.order as number, m.id as string]));

  const contentCourse = withLessonMaterials(AI_FOUNDATIONS);
  let updated = 0;
  for (const m of contentCourse.modules) {
    const moduleId = moduleIdByOrder.get(m.order);
    if (!moduleId) {
      console.warn(`Modul topilmadi (order=${m.order}), o'tkazib yuborildi.`);
      continue;
    }

    // `order` PostgREST'ning maxsus query parametri ham hisoblanadi. Shu sabab
    // `.eq("order", ...)` `order=eq.N` ko'rinishida noto'g'ri talqin qilinadi;
    // darslarni avval o'qib, keyin primary key orqali yangilaymiz.
    const { data: storedLessons, error: lessonsErr } = await admin
      .from("lessons")
      .select("id, order")
      .eq("module_id", moduleId);
    if (lessonsErr || !storedLessons) {
      console.error(`Modul ${m.order} darslari o'qilmadi:`, lessonsErr?.message);
      continue;
    }
    const lessonIdByOrder = new Map(
      storedLessons.map((lesson) => [lesson.order as number, lesson.id as string]),
    );

    for (const l of m.lessons) {
      const lessonId = lessonIdByOrder.get(l.order);
      if (!lessonId) {
        console.warn(`Dars topilmadi (module=${m.order}, order=${l.order}), o'tkazib yuborildi.`);
        continue;
      }
      const { error } = await admin
        .from("lessons")
        .update({ rows: l.rows, content: l.content ?? [], sandbox_enabled: l.sandboxEnabled })
        .eq("id", lessonId);
      if (error) {
        console.error(`Dars ${l.order} yangilanmadi:`, error.message);
        continue;
      }
      updated += 1;
    }
  }

  console.log(`Tayyor — ${updated} dars yangilandi.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
