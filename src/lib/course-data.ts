import type { Course, PricingOption } from "./types";
import { withLessonMaterials } from "./lesson-materials";

// ============================================================================
// YAGONA MANBA (single source of truth) — ikkita sotuvga tayyor kurs.
// Bu ma'lumot katalogni, kurs sahifalarini va DB seed'ini boshqaradi.
// Boy dars materiallari (content bloklari) src/lib/content/* dan biriktiriladi.
// Narxlar placeholder — admin paneldan yoki shu yerdan o'zgartiriladi.
// ============================================================================

const DEFAULT_PRICING: PricingOption[] = [
  {
    kind: "lifetime",
    label: "To'liq kurs uchun bir martalik to'lov",
    priceUzs: 600_000,
    note: "2 oylik jonli guruh, 16 darslik platforma va barcha amaliy materiallar.",
  },
  {
    kind: "monthly",
    label: "Oyma-oy to'lash",
    priceUzs: 350_000,
    note: "Har oy 350 000 so'm. Kurs 2 oy davom etadi (jami 700 000 so'm).",
  },
];

// ----------------------------------------------------------------------------
// KURS 1 — AI Video Creator
// ----------------------------------------------------------------------------
export const AI_VIDEO_CREATOR: Course = {
  slug: "ai-video-creator",
  title: "AI Video Creator",
  subtitle:
    "16 darslik amaliy kurs. G'oyadan professional AI videogacha: rasm, video, ovoz, musiqa va montaj.",
  year: "2027",
  pricing: DEFAULT_PRICING,
  modules: [
    {
      order: 1,
      code: "MODUL 01",
      title: "AI Poydevori",
      range: "Darslar 1–3 · Generativ AI, prompt va vosita tanlash",
      accent: "blue",
      mist: false,
      lessons: [
        {
          order: 1, title: "Generativ AI va zamonaviy modellar", isPreview: true,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Generativ AI, LLM, diffusion va video modellar. Creator uchun nima imkon beradi." },
            { kind: "Amaliy", text: "Bir g'oyani ChatGPT, Claude, Gemini'da sinash. Niche tanlash." },
            { kind: "Natija", text: "Tanlangan niche + 2 kuchli video g'oyasi." },
          ],
        },
        {
          order: 2, title: "Creator Prompt Engineering", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "Creator brief anatomiyasi: rol, kontekst, uslub, format, cheklov." },
            { kind: "Amaliy", text: "Yomon promptni kuchli briefga aylantirish. Meta-prompting." },
            { kind: "Natija", text: "3 qayta ishlatiladigan prompt shabloni." },
          ],
        },
        {
          order: 3, title: "AI tool va model tanlash", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "Qaysi ish uchun qaysi vosita. Bepul limit vs Pro tarif." },
            { kind: "Amaliy", text: "Ish oqimini bosqichlarga bo'lib, har biriga Free + Pro tanlash." },
            { kind: "Natija", text: "Shaxsiy tool stek + oylik byudjet." },
          ],
        },
      ],
    },
    {
      order: 2,
      code: "MODUL 02",
      title: "Vizual Poydevor",
      range: "Darslar 4–5 · AI rasm va izchillik",
      accent: "red",
      mist: true,
      lessons: [
        {
          order: 4, title: "AI rasm generatsiyasi", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Diffusion, kompozitsiya, uslub, yorug'lik, aspect ratio." },
            { kind: "Amaliy", text: "Bir g'oyani 3 uslubda 9:16 formatda generatsiya." },
            { kind: "Natija", text: "Eng kuchli kadr + uslub tanlovi." },
          ],
        },
        {
          order: 5, title: "Personaj, mahsulot va uslub izchilligi", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Izchillik: o'zgarmas belgilar, reference, character reference." },
            { kind: "Amaliy", text: "Bir personajni 3 sahnada izchil chiqarish." },
            { kind: "Natija", text: "Izchil vizual seriya (3 kadr)." },
          ],
        },
      ],
    },
    {
      order: 3,
      code: "MODUL 03",
      title: "AI Video Studio",
      range: "Darslar 6–13 · Ssenariydan barqaror video kadrgacha",
      accent: "yellow",
      mist: false,
      lessons: [
        {
          order: 6, title: "Video g'oya, hook va ssenariy", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "Hook (3 soniya), qiymat va CTA strukturasi." },
            { kind: "Amaliy", text: "5 hook + to'liq qisqa ssenariy yozish." },
            { kind: "Natija", text: "20-30 soniyalik hookli ssenariy." },
          ],
        },
        {
          order: 7, title: "Storyboard va shot list", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Ssenariyni kadr, kamera va davomiylikka bog'lash." },
            { kind: "Amaliy", text: "Shot list jadvali + har kadrga reference." },
            { kind: "Natija", text: "To'liq shot list + reference kadrlar." },
          ],
        },
        {
          order: 8, title: "AI video prompt anatomiyasi", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Video prompt: subyekt, harakat, kamera, yorug'lik, uslub." },
            { kind: "Amaliy", text: "Bir kadrni video promptga aylantirib barqarorlikni sinash." },
            { kind: "Natija", text: "Barqaror bitta video kadr." },
          ],
        },
        {
          order: 9, title: "Text-to-video va image-to-video", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Ikki yondashuv farqi. Image-to-video nazorati." },
            { kind: "Amaliy", text: "Kadrlarni jonlantirib mini-sekvensiya yig'ish." },
            { kind: "Natija", text: "2-3 kadrli video sekvensiya." },
          ],
        },
        {
          order: 10, title: "Kamera harakati va motion control", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Dolly, pan, zoom, orbit va motion control." },
            { kind: "Amaliy", text: "Bir kadrni turli kamera harakatlarida sinash." },
            { kind: "Natija", text: "Hikoyaga mos kamera harakati." },
          ],
        },
        {
          order: 11, title: "Personaj va mahsulot izchilligi", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Video izchilligi reference kadrdan boshlanadi." },
            { kind: "Amaliy", text: "Bir mahsulot/personaj bilan 3 kadrli izchil video." },
            { kind: "Natija", text: "Izchil video seriya." },
          ],
        },
        {
          order: 12, title: "Lip-sync va o'zbekcha ovoz", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "TTS, dublyaj, lip-sync; talaffuz va urg'u." },
            { kind: "Amaliy", text: "Matnni o'zbekcha ovozga aylantirib lip-sync moslash." },
            { kind: "Natija", text: "O'zbekcha ovozli video kadr." },
          ],
        },
        {
          order: 13, title: "AI musiqa va sound design", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Fon musiqa, sound effekt, audio balans, litsenziya." },
            { kind: "Amaliy", text: "Video ohangiga mos musiqa + effekt." },
            { kind: "Natija", text: "Musiqa va effekt bilan boyitilgan audio." },
          ],
        },
      ],
    },
    {
      order: 4,
      code: "MODUL 04",
      title: "Production va Monetizatsiya",
      range: "Darslar 14–16 · Montaj, format va daromad",
      accent: "green",
      mist: true,
      lessons: [
        {
          order: 14, title: "CapCut'da montaj va post-production", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Montaj ritmi, o'tish, subtitr va eksport formati." },
            { kind: "Amaliy", text: "Barcha kadr, ovoz va musiqani bitta videoga yig'ish." },
            { kind: "Natija", text: "9:16 formatda tayyor video." },
          ],
        },
        {
          order: 15, title: "Kontent formatlari va monetizatsiya", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Formatlar, kontent seriyasi va daromad yo'llari." },
            { kind: "Amaliy", text: "3 format + daromad rejasi + birinchi taklif." },
            { kind: "Natija", text: "Kontent + monetizatsiya rejasi." },
          ],
        },
        {
          order: 16, title: "Capstone: professional AI video", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Butun pipeline: g'oya → ssenariy → kadr → ovoz → montaj." },
            { kind: "Amaliy", text: "To'liq professional AI videoni yakunlash." },
            { kind: "Natija", text: "Portfolio uchun tayyor AI video." },
          ],
        },
      ],
    },
  ],
};

// ----------------------------------------------------------------------------
// KURS 2 — AI Builder
// ----------------------------------------------------------------------------
export const AI_BUILDER: Course = {
  slug: "ai-builder",
  title: "AI Builder",
  subtitle:
    "16 darslik amaliy kurs. G'oya → Website → AI Web App → Telegram bot → AI agentgacha bitta to'liq mahsulot.",
  year: "2027",
  pricing: DEFAULT_PRICING,
  modules: [
    {
      order: 1,
      code: "MODUL 01",
      title: "Vibe Coding va mahsulot rejasi",
      range: "Darslar 1–2 · Coding agentlar va texnik reja",
      accent: "blue",
      mist: false,
      lessons: [
        {
          order: 1, title: "Vibe Coding va coding agentlar", isPreview: true,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "Vibe coding nima. Coding agentlar: Cursor, Claude, Lovable, Bolt, v0." },
            { kind: "Amaliy", text: "Bir g'oyani agent bilan birinchi ishlaydigan versiyaga." },
            { kind: "Natija", text: "Ishlaydigan MVP qoralamasi." },
          ],
        },
        {
          order: 2, title: "Muammo, MVP, PRD va loyiha arxitekturasi", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "Muammo, MVP doirasi, PRD va arxitektura." },
            { kind: "Amaliy", text: "Bir sahifalik PRD + ma'lumot modeli." },
            { kind: "Natija", text: "Quriladigan mahsulotning texnik rejasi." },
          ],
        },
      ],
    },
    {
      order: 2,
      code: "MODUL 02",
      title: "Website yaratish",
      range: "Darslar 3–5 · Landing, frontend, deploy",
      accent: "red",
      mist: true,
      lessons: [
        {
          order: 3, title: "Landing page va UI/UX", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "UI/UX asoslari: aniq xabar, ierarxiya, CTA." },
            { kind: "Amaliy", text: "Ishlaydigan landing birinchi versiyasi." },
            { kind: "Natija", text: "Toza, aniq landing page." },
          ],
        },
        {
          order: 4, title: "Responsive frontend, forma va interaktivlik", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Responsive layout, forma, validatsiya, holat." },
            { kind: "Amaliy", text: "Validatsiyali responsive forma qo'shish." },
            { kind: "Natija", text: "Interaktiv, mobilga mos sahifa." },
          ],
        },
        {
          order: 5, title: "Database ulash, deploy va domen", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "DB ulash, deploy, domen va jonli URL." },
            { kind: "Amaliy", text: "Supabase + Vercel deploy + domen bog'lash." },
            { kind: "Natija", text: "Internetda ishlaydigan haqiqiy website." },
          ],
        },
      ],
    },
    {
      order: 3,
      code: "MODUL 03",
      title: "AI Web App",
      range: "Darslar 6–8 · Backend, LLM API va auth",
      accent: "yellow",
      mist: false,
      lessons: [
        {
          order: 6, title: "Backend va API asoslari", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "API shartnomasi, so'rov-javob va status kodlar." },
            { kind: "Amaliy", text: "Bitta API endpoint yozib frontendga ulash." },
            { kind: "Natija", text: "Ishlaydigan API endpoint." },
          ],
        },
        {
          order: 7, title: "LLM API va structured output", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "LLM API va structured output (JSON schema)." },
            { kind: "Amaliy", text: "Structured output qaytaradigan AI funksiya." },
            { kind: "Natija", text: "Barqaror AI funksiya." },
          ],
        },
        {
          order: 8, title: "Authentication, foydalanuvchi ma'lumotlari va AI funksiyasi", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Auth, foydalanuvchi ma'lumoti himoyasi, kalitlar." },
            { kind: "Amaliy", text: "Login/register + foydalanuvchiga xos AI funksiya." },
            { kind: "Natija", text: "Login va AI imkoniyatiga ega web-ilova." },
          ],
        },
      ],
    },
    {
      order: 4,
      code: "MODUL 04",
      title: "AI Telegram Bot",
      range: "Darslar 9–11 · Multimodal bot va deploy",
      accent: "green",
      mist: true,
      lessons: [
        {
          order: 9, title: "Telegram bot arxitekturasi va komandalar", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Bot arxitekturasi, komandalar, webhook va secret." },
            { kind: "Amaliy", text: "Ishlaydigan bot: /start + foydali komanda." },
            { kind: "Natija", text: "Serverga ulangan Telegram bot." },
          ],
        },
        {
          order: 10, title: "Matn, rasm va ovozni tushunadigan AI bot", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Multimodal: matn, vision va ovoz transkripsiyasi." },
            { kind: "Amaliy", text: "Botga AI matn/rasm/ovoz qayta ishlashini qo'shish." },
            { kind: "Natija", text: "Multimodal AI bot." },
          ],
        },
        {
          order: 11, title: "Botni database va web-app bilan ulash, deploy", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Barqaror ID, idempotent webhook, umumiy ma'lumot." },
            { kind: "Amaliy", text: "Bot + DB + web-app ulash va doimiy deploy." },
            { kind: "Natija", text: "Serverda doimiy ishlaydigan multimodal bot." },
          ],
        },
      ],
    },
    {
      order: 5,
      code: "MODUL 05",
      title: "AI Agentlar",
      range: "Darslar 12–15 · Tool, RAG, xotira va xavfsizlik",
      accent: "blue",
      mist: false,
      lessons: [
        {
          order: 12, title: "Workflow va AI agent farqi", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "Workflow va agent farqi; qachon qaysi biri." },
            { kind: "Amaliy", text: "Bir vazifani ikki yondashuvda loyihalash." },
            { kind: "Natija", text: "Asoslangan yondashuv tavsiyasi." },
          ],
        },
        {
          order: 13, title: "Function calling va tashqi tool'lar", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "Function calling, tool schema, least privilege." },
            { kind: "Amaliy", text: "Agentga ishlaydigan tool ulash." },
            { kind: "Natija", text: "Tool ishlatadigan agent." },
          ],
        },
        {
          order: 14, title: "RAG, xotira va MCP integratsiyasi", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "RAG, embedding, xotira va MCP." },
            { kind: "Amaliy", text: "Hujjatlardan javob topadigan RAG oqimi." },
            { kind: "Natija", text: "Ma'lumot topadigan, asoslangan agent." },
          ],
        },
        {
          order: 15, title: "Human approval, evals, xavfsizlik va monitoring", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Human approval, evals, xavfsizlik va monitoring." },
            { kind: "Amaliy", text: "Approval + eval + log qo'shish." },
            { kind: "Natija", text: "Ishlab chiqarishga tayyor agent." },
          ],
        },
      ],
    },
    {
      order: 6,
      code: "MODUL 06",
      title: "Capstone",
      range: "Dars 16 · Hammasini bitta mahsulotga birlashtirish",
      accent: "red",
      mist: true,
      lessons: [
        {
          order: 16, title: "Website + Telegram bot + AI agentni birlashtirish", isPreview: false,
          videoKey: null, youtubeId: null, durationSec: 0, sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Uch qismni bitta mahsulotga birlashtirish." },
            { kind: "Amaliy", text: "Yakuniy loyihani yig'ish va boshdan oxirigacha sinash." },
            { kind: "Natija", text: "To'liq AI mahsulot + portfolio." },
          ],
        },
      ],
    },
  ],
};

export const COURSES: Course[] = [AI_VIDEO_CREATOR, AI_BUILDER];

/** Katalog/kabinet kabi bitta kurs kutilgan joylar uchun asosiy kurs. */
export const PRIMARY_COURSE = AI_VIDEO_CREATOR;

export function getCourse(slug: string): Course | undefined {
  const course = COURSES.find((c) => c.slug === slug);
  return course ? withLessonMaterials(course) : undefined;
}

export function getLesson(course: Course, order: number) {
  for (const m of course.modules) {
    const lesson = m.lessons.find((l) => l.order === order);
    if (lesson) return { module: m, lesson };
  }
  return undefined;
}

export function allLessons(course: Course) {
  return course.modules.flatMap((m) => m.lessons).sort((a, b) => a.order - b.order);
}

export function formatUzs(amount: number): string {
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
}
