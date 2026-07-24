import { createClient } from "@supabase/supabase-js";
import { COURSES } from "../src/lib/course-data";
import type { QuizBank } from "./quiz-banks/types";
import { VIDEO_CREATOR_QUIZ } from "./quiz-banks/ai-video-creator";
import { BUILDER_QUIZ } from "./quiz-banks/ai-builder";

const BANK_BY_SLUG: Record<string, QuizBank> = {
  "ai-video-creator": VIDEO_CREATOR_QUIZ,
  "ai-builder": BUILDER_QUIZ,
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase URL/service key topilmadi");
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  let created = 0;

  for (const course of COURSES) {
    const bank = BANK_BY_SLUG[course.slug];
    if (!bank) {
      console.warn(`${course.slug}: viktorina banki topilmadi, o'tkazib yuborildi.`);
      continue;
    }

    const { data: lessons, error } = await admin
      .from("lessons")
      .select("id, order, modules!inner(courses!inner(slug))")
      .eq("modules.courses.slug", course.slug);
    if (error) throw error;
    if (!lessons?.length) {
      console.warn(`${course.slug}: darslar topilmadi (avval seed.sql'ni qo'llang).`);
      continue;
    }

    for (const lesson of lessons) {
      const seeds = bank[Number(lesson.order)] ?? [];
      // `order` PostgREST'ning maxsus parametri — `.eq("order", n)` filtri noto'g'ri
      // talqin qilinadi. Shu sabab darsning mavjud savol tartiblarini bir marta o'qib,
      // JS'da tekshiramiz (idempotent qayta ishga tushirish uchun).
      const { data: existingQs } = await admin.from("quiz_questions").select("order").eq("lesson_id", lesson.id);
      const existingOrders = new Set((existingQs ?? []).map((row) => Number(row.order)));
      for (const [index, seed] of seeds.entries()) {
        const order = index + 1;
        if (existingOrders.has(order)) continue;

        const { data: question, error: questionError } = await admin.from("quiz_questions").insert({
          lesson_id: lesson.id, order, prompt: seed.prompt, explanation: seed.explanation, points: 10,
        }).select("id").single();
        if (questionError || !question) throw questionError ?? new Error("Savol yaratilmadi");

        // To'g'ri javob har doim 1-o'rinda turmasligi uchun pozitsiyani aylantiramiz (deterministik).
        const options = [seed.wrong[0], seed.wrong[1], seed.wrong[2]];
        const correctPos = (order - 1) % 4;
        options.splice(correctPos, 0, seed.correct);

        const { error: optionError } = await admin.from("quiz_options").insert(options.map((text, optionIndex) => ({
          question_id: question.id, order: optionIndex + 1, text, is_correct: text === seed.correct,
        })));
        if (optionError) {
          await admin.from("quiz_questions").delete().eq("id", question.id);
          throw optionError;
        }
        created += 1;
      }
    }
    console.log(`${course.slug}: savollar seed qilindi.`);
  }

  console.log(`Tayyor — jami ${created} yangi savol qo'shildi; har darsda 5 tadan savol bor.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
