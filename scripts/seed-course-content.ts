/**
 * Bir martalik skript: src/lib/course-data.ts'dagi kurslarni yagona manba sifatida
 * olib, Supabase'dagi `lessons.rows` (Nazariy/Amaliy/Natija), `lessons.content`
 * (boy bloklar) va `lessons.sandbox_enabled` ustunlarini to'ldiradi.
 *
 * Ishga tushirish: node --env-file=.env.local --import=tsx scripts/seed-course-content.ts
 *
 * Talab: supabase/migrations/* va supabase/seed.sql avval qo'llangan bo'lishi kerak
 * (kurs/modul/dars metadata).
 */
import { createClient } from "@supabase/supabase-js";
import { COURSES } from "../src/lib/course-data";
import { withLessonMaterials } from "../src/lib/lesson-materials";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY topilmadi (.env.local)");
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  let updated = 0;

  for (const baseCourse of COURSES) {
    const { data: course, error: courseErr } = await admin
      .from("courses")
      .select("id")
      .eq("slug", baseCourse.slug)
      .maybeSingle();
    if (courseErr || !course) {
      console.warn(`Kurs topilmadi: ${baseCourse.slug}. Avval supabase/seed.sql'ni qo'llang. O'tkazib yuborildi.`);
      continue;
    }

    const { data: modules, error: modulesErr } = await admin
      .from("modules")
      .select("id, order")
      .eq("course_id", course.id);
    if (modulesErr || !modules) {
      console.error(`Modullarni o'qib bo'lmadi (${baseCourse.slug})`);
      continue;
    }

    const moduleIdByOrder = new Map(modules.map((m) => [m.order as number, m.id as string]));
    const contentCourse = withLessonMaterials(baseCourse);

    for (const m of contentCourse.modules) {
      const moduleId = moduleIdByOrder.get(m.order);
      if (!moduleId) {
        console.warn(`Modul topilmadi (${baseCourse.slug}, order=${m.order}), o'tkazib yuborildi.`);
        continue;
      }

      // `order` PostgREST'ning maxsus query parametri ham hisoblanadi. Shu sabab
      // darslarni avval o'qib, keyin primary key orqali yangilaymiz.
      const { data: storedLessons, error: lessonsErr } = await admin
        .from("lessons")
        .select("id, order")
        .eq("module_id", moduleId);
      if (lessonsErr || !storedLessons) {
        console.error(`Modul ${m.order} darslari o'qilmadi (${baseCourse.slug}):`, lessonsErr?.message);
        continue;
      }
      const lessonIdByOrder = new Map(
        storedLessons.map((lesson) => [lesson.order as number, lesson.id as string]),
      );

      for (const l of m.lessons) {
        const lessonId = lessonIdByOrder.get(l.order);
        if (!lessonId) {
          console.warn(`Dars topilmadi (${baseCourse.slug}, module=${m.order}, order=${l.order}), o'tkazib yuborildi.`);
          continue;
        }
        const { error } = await admin
          .from("lessons")
          .update({ rows: l.rows, content: l.content ?? [], sandbox_enabled: l.sandboxEnabled })
          .eq("id", lessonId);
        if (error) {
          console.error(`Dars ${l.order} yangilanmadi (${baseCourse.slug}):`, error.message);
          continue;
        }
        updated += 1;
      }
    }
    console.log(`${baseCourse.slug}: darslar yangilandi.`);
  }

  console.log(`Tayyor — jami ${updated} dars yangilandi.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
