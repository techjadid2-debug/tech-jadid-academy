import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { env, isSandboxConfigured } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { canAccessLesson } from "@/lib/access";
import { getCourseAsync } from "@/lib/course";
import { getLesson } from "@/lib/course-data";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getLessonId } from "@/lib/supabase/db";

// ============================================================================
// AI Sandbox ("Sinab ko'ring") — W3Schools uslubi, Vercel AI Gateway orqali.
//
// Xarajat nazorati (model chaqirilishidan OLDIN tekshiriladi):
//   1. auth (401) → 2. kurs sotib olingan (403) → 3. darsda sandbox yoqilgan
//   → 4. kunlik limit (429) → 5. kirish uzunligi (413).
// Har chaqiruv ai_sandbox_usage'ga yoziladi (audit + limit).
// ============================================================================

const DAILY_LIMIT = 30;
const MAX_PROMPT_CHARS = 2000;
const MAX_OUTPUT_TOKENS = 800;

export async function POST(req: NextRequest) {
  if (!isSandboxConfigured) {
    return NextResponse.json(
      { error: "AI maydon hozircha faol emas (gateway sozlanmagan)." },
      { status: 503 },
    );
  }
  const admin = createSupabaseAdmin();
  if (!admin) {
    // Limit/audit jurnali yozib bo'lmasa — xarajat nazoratisiz model chaqirmaymiz.
    return NextResponse.json({ error: "AI maydon real rejimda ishlaydi." }, { status: 503 });
  }

  let body: { slug?: string; order?: number; prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const slug = String(body.slug ?? "");
  const order = Number(body.order ?? 0);
  const prompt = String(body.prompt ?? "").trim();

  if (!prompt) return NextResponse.json({ error: "Savol bo'sh." }, { status: 400 });
  if (prompt.length > MAX_PROMPT_CHARS) {
    return NextResponse.json(
      { error: `Matn juda uzun (maksimum ${MAX_PROMPT_CHARS} belgi).` },
      { status: 413 },
    );
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi." }, { status: 401 });

  const course = await getCourseAsync(slug);
  const found = course ? getLesson(course, order) : undefined;
  if (!course || !found) return NextResponse.json({ error: "Dars topilmadi." }, { status: 404 });
  if (!found.lesson.sandboxEnabled) {
    return NextResponse.json({ error: "Bu darsda AI maydon yo'q." }, { status: 400 });
  }

  if (!(await canAccessLesson(user.id, slug, order))) {
    return NextResponse.json({ error: "Bu maydon kursni ochganlar uchun." }, { status: 403 });
  }

  // Limit tekshiruvi + pre-charge bitta DB lock ostida bajariladi.
  const lessonId = await getLessonId(slug, order);
  const { data: usageId, error: usageError } = await admin.rpc("claim_ai_sandbox_usage", {
    p_user_id: user.id,
    p_lesson_id: lessonId,
    p_input_chars: prompt.length,
    p_model: env.sandboxModel,
    p_daily_limit: DAILY_LIMIT,
  });
  if (usageError) {
    console.error("[sandbox] usage pre-charge failed", usageError);
    return NextResponse.json({ error: "Xizmat vaqtincha ishlamayapti." }, { status: 503 });
  }
  if (!usageId) {
    return NextResponse.json(
      { error: `Kunlik limit tugadi (${DAILY_LIMIT} ta so'rov). Ertaga davom eting.` },
      { status: 429 },
    );
  }

  const result = streamText({
    model: env.sandboxModel,
    system:
      `Sen Tech Jadid akademiyasining AI o'qituvchi yordamchisisan. ` +
      `Hozirgi dars: "${found.lesson.title}" (modul: "${found.module.title}", kurs: "${course.title}"). ` +
      `O'quvchi shu dars mavzusi bo'yicha mashq qilyapti — masalan prompt yozishni sinayapti. ` +
      `Faqat dars mavzusiga oid savollarga javob ber; mavzudan tashqari so'rovlarga qisqa rad javobi qaytar. ` +
      `Javoblarni o'zbek tilida (foydalanuvchi boshqa tilda yozsa — o'sha tilda), qisqa va amaliy qilib ber.`,
    prompt,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: req.signal,
    onEnd: async ({ text }) => {
      const { error } = await admin
        .from("ai_sandbox_usage")
        .update({ output_chars: text.length })
        .eq("id", usageId);
      if (error) console.error("[sandbox] usage log failed", error);
    },
  });

  return result.toTextStreamResponse();
}
