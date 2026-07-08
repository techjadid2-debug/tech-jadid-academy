import type { Course } from "./types";

// ============================================================================
// YAGONA MANBA (single source of truth) — "Sun'iy Intellekt Asoslari" kursi.
// Bu ma'lumot landing sahifasini, katalogni va DB seed'ini boshqaradi.
// Narxlar hozircha placeholder — keyin admin paneldan yoki bu yerdan o'zgartiriladi.
// ============================================================================

export const AI_FOUNDATIONS: Course = {
  slug: "ai-asoslari",
  title: "Sun'iy Intellekt Asoslari",
  subtitle:
    "16 darslik amaliy kurs. AI'ni tushuna va super darajada ishlata oladigan mutaxassis bo'lasiz.",
  year: "2026",
  pricing: [
    {
      kind: "lifetime",
      label: "Bir martalik to'lov",
      priceUzs: 350_000,
      note: "Bitta to'lov — darhol barcha 16 darsga umrbod kirish.",
    },
    {
      kind: "installment2",
      label: "2 bo'lib to'lash",
      priceUzs: 225_000,
      note: "Hozir 225 000 so'm (1–8-darslar ochiladi), keyin yana 225 000 so'm (jami 450 000) — qolgan darslar ochiladi.",
    },
  ],
  modules: [
    {
      order: 1,
      code: "MODUL 01",
      title: "AI Poydevori",
      range: "Darslar 1–3 · Model qanday ishlaydi va qaysi birini tanlash",
      accent: "blue",
      mist: false,
      lessons: [
        {
          order: 1,
          title: "Sun'iy intellekt nima?",
          isPreview: true,
          videoKey: "ai-asoslari/01",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "AI / ML / Deep Learning / Generative AI farqi. Nega aynan hozir portladi." },
            { kind: "Amaliy", text: "3 vazifa ChatGPT'da: yozish, tahlil, g'oya. Kuchli/zaif tomonlar." },
            { kind: "Natija", text: "\"AI mumkin / mumkin emas\" ro'yxati." },
          ],
        },
        {
          order: 2,
          title: "LLM ichida nima bor?",
          isPreview: false,
          videoKey: "ai-asoslari/02",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Token, kontekst oynasi, bashorat. Gallyutsinatsiya sababi. Temperature." },
            { kind: "Amaliy", text: "Promptni past/yuqori temperature'da solishtirish. Xatoni aniqlash." },
            { kind: "Natija", text: "\"Ishonish mumkin/mumkin emas\" tahlili." },
          ],
        },
        {
          order: 3,
          title: "Modellar dunyosi va model tanlash",
          isPreview: false,
          videoKey: "ai-asoslari/03",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "ChatGPT vs Claude vs Gemini. Reasoning modellari. Bepul vs pullik." },
            { kind: "Amaliy", text: "Bitta vazifani 3 modelda ishlatib benchmark qilish." },
            { kind: "Natija", text: "\"Qaysi ish uchun qaysi model\" qo'llanmasi." },
          ],
        },
      ],
    },
    {
      order: 2,
      code: "MODUL 02",
      title: "Prompt Engineering",
      range: "Darslar 4–6 · Aniq buyruqdan qayta ishlatiladigan workflow'gacha",
      accent: "red",
      mist: true,
      lessons: [
        {
          order: 4,
          title: "Prompt Engineering asoslari",
          isPreview: false,
          videoKey: "ai-asoslari/04",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "Anatomiya: Rol + Kontekst + Vazifa + Format + Cheklovlar. Zero/few-shot." },
            { kind: "Amaliy", text: "Yomon promptni kuchliga aylantirish. Kasbga xos 3 prompt." },
            { kind: "Natija", text: "5 tayyor, qayta ishlatiladigan prompt." },
          ],
        },
        {
          order: 5,
          title: "Advanced Prompting",
          isPreview: false,
          videoKey: "ai-asoslari/05",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "Chain-of-Thought, structured output, system prompt, meta-prompting." },
            { kind: "Amaliy", text: "Aniq formatni majburlash. AI'dan o'zingizga prompt yozdirish." },
            { kind: "Natija", text: "Ko'p qadamli 1 \"ustoz prompt\"." },
          ],
        },
        {
          order: 6,
          title: "Prompt'dan shaxsiy workflow'ga",
          isPreview: false,
          videoKey: "ai-asoslari/06",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "Prompt kutubxonasi. Bir marta yozib, doim qayta ishlatish." },
            { kind: "Amaliy", text: "Kasbi uchun 8–10 promptli kutubxona qurish." },
            { kind: "Natija", text: "Shaxsiy prompt kutubxonasi." },
          ],
        },
      ],
    },
    {
      order: 3,
      code: "MODUL 03",
      title: "Media Generatsiya",
      range: "Darslar 7–9 · Rasmdan to'liq video pipeline'gacha",
      accent: "yellow",
      mist: false,
      lessons: [
        {
          order: 7,
          title: "Rasm generatsiyasi asoslari",
          isPreview: false,
          videoKey: "ai-asoslari/07",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Diffusion. Midjourney, GPT image, Gemini, Flux, Ideogram. Prompt tuzilishi." },
            { kind: "Amaliy", text: "Bir g'oyani turli tool'larda generatsiya va boshqarish." },
            { kind: "Natija", text: "5 uslubdagi rasmlar to'plami." },
          ],
        },
        {
          order: 8,
          title: "Advanced rasm: izchillik, tahrirlash",
          isPreview: false,
          videoKey: "ai-asoslari/08",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Personaj/uslub izchilligi, inpainting, matnli rasm, reference." },
            { kind: "Amaliy", text: "Bir personajni bir necha sahnada izchil chiqarish va tahrirlash." },
            { kind: "Natija", text: "Izchil brend/personaj to'plami." },
          ],
        },
        {
          order: 9,
          title: "Video + Ovoz: to'liq pipeline",
          isPreview: false,
          videoKey: "ai-asoslari/09",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Veo, Sora, Kling, Runway. Image-to-video. TTS, Suno, ElevenLabs." },
            { kind: "Amaliy", text: "Ssenariy → rasm → video → CapCut. O'zbekcha ovoz alohida dublyaj." },
            { kind: "Natija", text: "To'liq yig'ilgan qisqa AI video." },
          ],
        },
      ],
    },
    {
      order: 4,
      code: "MODUL 04",
      title: "Vibe Coding",
      range: "Darslar 10–12 · Kod yozmasdan real mahsulot qurish",
      accent: "green",
      mist: true,
      lessons: [
        {
          order: 10,
          title: "Vibe coding nima? Tool'lar",
          isPreview: false,
          videoKey: "ai-asoslari/10",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "Kod emas, natijani tasvirlash. Claude, Cursor, Lovable, Bolt, v0." },
            { kind: "Amaliy", text: "G'oyani tasvirlab birinchi sahifa. Xatoni tuzattirish." },
            { kind: "Natija", text: "Ishlaydigan 1-sahifali web sahifa." },
          ],
        },
        {
          order: 11,
          title: "Birinchi haqiqiy app + deploy",
          isPreview: false,
          videoKey: "ai-asoslari/11",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "App tuzilishi. So'ra → ko'r → tuzat. Deploy (Vercel)." },
            { kind: "Amaliy", text: "Foydali asbob qurish va internetga joylash." },
            { kind: "Natija", text: "Jonli URL bilan ishlaydigan app." },
          ],
        },
        {
          order: 12,
          title: "AI-quvvatli app qurish",
          isPreview: false,
          videoKey: "ai-asoslari/12",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "API kaliti nima. AI'ni app ichiga ulash. \"Aqlli\" xususiyat." },
            { kind: "Amaliy", text: "Appga AI qo'shish: savol-javob bot yoki xulosalovchi." },
            { kind: "Natija", text: "AI ishlaydigan real mini-mahsulot." },
          ],
        },
      ],
    },
    {
      order: 5,
      code: "MODUL 05",
      title: "Agentlar & Avtomatlashtirish",
      range: "Darslar 13–14 · AI'ni asboblarga ulash va bot qurish",
      accent: "blue",
      mist: false,
      lessons: [
        {
          order: 13,
          title: "AI agentlar va MCP",
          isPreview: false,
          videoKey: "ai-asoslari/13",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "Agent nima. MCP — AI'ni tashqi asboblarga ulash. Xavfsizlik." },
            { kind: "Amaliy", text: "Tayyor connector'ni sinash. Ko'p qadamli vazifa." },
            { kind: "Natija", text: "Avtomatlashtirilgan ko'p qadamli oqim." },
          ],
        },
        {
          order: 14,
          title: "Shaxsiy AI yordamchi + Telegram bot",
          isPreview: false,
          videoKey: "ai-asoslari/14",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: true,
          rows: [
            { kind: "Nazariy", text: "Kundalik avtomatlashtirish. Nega Telegram eng oson kanal." },
            { kind: "Amaliy", text: "Vibe coding bilan AI Telegram bot yasash." },
            { kind: "Natija", text: "Ishlaydigan shaxsiy Telegram bot." },
          ],
        },
      ],
    },
    {
      order: 6,
      code: "MODUL 06",
      title: "Tatbiq & Monetizatsiya",
      range: "Darslar 15–16 · Ko'nikmani real daromadga aylantirish",
      accent: "red",
      mist: true,
      lessons: [
        {
          order: 15,
          title: "AI'ni real kasbga tatbiq etish",
          isPreview: false,
          videoKey: "ai-asoslari/15",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Kasbga xos oqimlar: kontent, marketing, ta'lim, biznes." },
            { kind: "Amaliy", text: "Real vazifani to'liq AI oqimiga aylantirish." },
            { kind: "Natija", text: "Shaxsiy \"AI workflow\" hujjati." },
          ],
        },
        {
          order: 16,
          title: "Capstone: Portfolio + Monetizatsiya",
          isPreview: false,
          videoKey: "ai-asoslari/16",
          youtubeId: null,
          durationSec: 0,
          sandboxEnabled: false,
          rows: [
            { kind: "Nazariy", text: "Pulga aylantirish: freelance, xizmat, mini-mahsulot, brend." },
            { kind: "Amaliy", text: "Yakuniy loyihani yig'ish va bir sahifada namoyish." },
            { kind: "Natija", text: "To'liq portfolio + monetizatsiya rejasi." },
          ],
        },
      ],
    },
  ],
};

export const COURSES: Course[] = [AI_FOUNDATIONS];

export function getCourse(slug: string): Course | undefined {
  return COURSES.find((c) => c.slug === slug);
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
