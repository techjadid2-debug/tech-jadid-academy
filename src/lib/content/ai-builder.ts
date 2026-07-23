import type { LessonContentBlock } from "../types";
import { labLesson } from "./lab";

// ============================================================================
// AI Builder — 16 dars uchun to'liq material (global order 1..16).
// G'oya → Website → AI Web App → Telegram bot → AI agent → Deploy.
// Har dars 120 daqiqalik project lab. Free→Pro vosita tavsiyalari bilan.
// ============================================================================

export const BUILDER_MATERIALS: Record<number, LessonContentBlock[]> = {
  1: labLesson({
    overview:
      "Vibe coding — mahsulot g'oyasini aniq tasvirlab, coding agent yordamida kod va interfeysni yaratish usuli. Bugun coding agentlar (Cursor, Claude, Lovable, Bolt, v0) qanday ishlashini va qanday to'g'ri boshqarishni o'rganasiz.",
    keyPoint:
      "Siz muammoni, foydalanuvchini va kutilgan natijani qanchalik aniq tushuntirsangiz, agent shunchalik foydali kod beradi. Agent yozgan kodni ishga tushirib, sinab ko'ring.",
    steps: [
      "Bitta kichik g'oyani tanlab, coding agentga aniq tasvirlab bering.",
      "Agent yozgan kodni ishga tushiring va natijani ko'ring.",
      "Xatoni aniq kontekst (error + kutilgan natija) bilan qayta yuboring.",
    ],
    tools: {
      items: [
        { name: "Cursor", free: "Bepul: cheklangan AI so'rovlar bilan IDE", pro: "Pro (~$20/oy): kuchli modellar, cheksizga yaqin foydalanish" },
        { name: "Claude / Claude Code", free: "Bepul: suhbatda kod yozish", pro: "Pro/Max: uzoq loyiha va terminalda agent" },
        { name: "Lovable / Bolt / v0", free: "Bepul kunlik kredit: to'liq ilova generatsiya", pro: "Pro: ko'proq generatsiya + deploy" },
      ],
    },
    prompt: {
      title: "Coding agentga birinchi brief",
      text: "Men [mahsulot] qurmoqchiman. Foydalanuvchi: [kim]. Asosiy vazifa: [foydalanuvchi nima qiladi].\n\nEng kichik ishlaydigan versiyani (MVP) qur. Texnologiya: [masalan Next.js]. Avval rejani ko'rsat, keyin kodni yoz. Har qadamda nima qilayotganingni tushuntir.",
    },
    task: {
      text: "Bitta kichik g'oyani coding agent bilan birinchi ishlaydigan versiyagacha olib boring.",
      checklist: [
        "G'oyani aniq brief qilib yozdingiz.",
        "Agent kodini ishga tushirdingiz.",
        "Kamida bitta xatoni kontekst bilan tuzattirdingiz.",
        "Natija brauzerda ishlaydi.",
      ],
    },
  }),
  2: labLesson({
    overview:
      "Yaxshi mahsulot rejasi kod yozishdan oldin boshlanadi. Bugun muammoni aniqlash, MVP doirasini belgilash, PRD (mahsulot talablari) va loyiha arxitekturasini tuzishni o'rganasiz.",
    keyPoint:
      "MVP — barcha funksiya emas, bitta muammoni hal qiladigan eng kichik ishlaydigan versiya. Doirani tor tuting.",
    steps: [
      "Muammo, foydalanuvchi va asosiy natijani yozing.",
      "MVP funksiyalarini 'kerak' va 'keyin' ga ajrating.",
      "AI bilan qisqa PRD va arxitektura sxemasini tuzing.",
    ],
    tools: {
      items: [
        { name: "ChatGPT / Claude", free: "Bepul: PRD, user story, arxitektura", pro: "Plus/Pro: uzun hujjat va izchillik" },
      ],
    },
    prompt: {
      title: "PRD generatori",
      text: "Mahsulot g'oyasi: [tavsif]. Foydalanuvchi: [kim]. Muammo: [nima].\n\nQisqa PRD yoz: 1) muammo, 2) yechim, 3) MVP funksiyalari (kerak/keyin), 4) asosiy ekranlar, 5) ma'lumot modeli, 6) texnologiya tavsiyasi. Sodda va aniq yoz.",
    },
    task: {
      text: "Kurs davomida quradigan mahsulotingiz uchun bir sahifalik PRD va arxitektura rejasini yozing.",
      checklist: [
        "Muammo va foydalanuvchi aniq.",
        "MVP funksiyalari 'kerak/keyin' ga ajratilgan.",
        "Ma'lumot modeli chizilgan.",
        "Texnologiya tanlovi asoslangan.",
      ],
    },
  }),
  3: labLesson({
    overview:
      "Landing page — mahsulotingizning birinchi taassuroti. Bugun UI/UX asoslari, aniq xabar, ierarxiya va CTA bilan ishlaydigan landing qurishni o'rganasiz.",
    keyPoint:
      "Landing bir savolga javob bersin: bu kim uchun va nima foyda beradi? Ortiqcha element emas, aniqlik yutadi.",
    steps: [
      "Landing strukturasini yozing: hero → foyda → ijtimoiy isbot → CTA.",
      "Coding agent bilan birinchi versiyani generatsiya qiling.",
      "Matn va CTA'ni aniqlashtirib, dizaynni soddalashtiring.",
    ],
    tools: {
      items: [
        { name: "v0", free: "Bepul kredit: UI generatsiya (React/Tailwind)", pro: "Pro: ko'proq generatsiya + loyiha" },
        { name: "Lovable", free: "Bepul: to'liq landing generatsiya", pro: "Pro: deploy + ko'proq kredit" },
        { name: "Figma", free: "Bepul: dizayn + prototip", pro: "Professional: jamoa va kengaytmalar" },
      ],
    },
    prompt: {
      title: "Landing generatori",
      text: "[mahsulot] uchun landing page qur. Auditoriya: [kim]. Asosiy foyda: [nima].\nStruktura: hero (sarlavha + subtekst + CTA), 3 foyda bloki, ijtimoiy isbot, yakuniy CTA.\nToza, zamonaviy, responsive dizayn. Tailwind ishlat.",
    },
    task: {
      text: "Mahsulotingiz uchun ishlaydigan landing page'ning birinchi versiyasini quring.",
      checklist: [
        "Struktura hero → foyda → CTA.",
        "Xabar aniq va bitta savolga javob beradi.",
        "CTA ko'rinarli.",
        "Dizayn toza va soddalashtirilgan.",
      ],
    },
  }),
  4: labLesson({
    overview:
      "Responsive frontend har qurilmada yaxshi ko'rinadi. Bugun moslashuvchan layout, forma va interaktivlikni qo'shishni o'rganasiz — foydalanuvchi harakati bilan javob beradigan sahifa.",
    keyPoint:
      "Avval mobil ko'rinishni to'g'rilang: ko'p foydalanuvchi telefonda kiradi. Forma inputlarini har doim tekshiring (validatsiya).",
    steps: [
      "Landing'ni mobil va desktopda tekshirib, layoutni moslang.",
      "Ishlaydigan forma qo'shing (masalan aloqa yoki ro'yxat).",
      "Input validatsiyasi va oddiy interaktivlik (holat, xabar) qo'shing.",
    ],
    tools: {
      items: [
        { name: "Cursor / Claude Code", free: "Bepul: komponent va forma kodi", pro: "Pro: kuchli model + tez iteratsiya" },
        { name: "Tailwind CSS", free: "Bepul, ochiq manba: responsive util", pro: "Tailwind UI: tayyor komponentlar (bir martalik)" },
      ],
    },
    prompt: {
      title: "Responsive forma",
      text: "Sahifamga responsive [aloqa/ro'yxat] formasi qo'sh. Maydonlar: [ro'yxat].\nMobil va desktopda yaxshi ko'rinsin. Input validatsiyasi va yuborilgach tasdiq xabari bo'lsin. Xato holatini ham ko'rsat.",
    },
    task: {
      text: "Landing'ingizga ishlaydigan, validatsiyali va responsive forma qo'shing.",
      checklist: [
        "Mobil va desktop layout to'g'ri.",
        "Forma ishlaydi va ma'lumot qabul qiladi.",
        "Input validatsiyasi bor.",
        "Tasdiq va xato holatlari ko'rsatiladi.",
      ],
    },
  }),
  5: labLesson({
    overview:
      "Endi sahifangizni haqiqiy ma'lumotlar bazasiga ulaysiz, internetga deploy qilasiz va domen bog'laysiz. Bugun mahsulotingiz jonli URL orqali ishlaydi.",
    keyPoint:
      "Kichik, sinovdan o'tgan versiyani chiqarish — mukammal, lekin tugamaydigan mahsulotdan foydaliroq. Deploy'dan keyin asosiy oqimni sinab ko'ring.",
    steps: [
      "Supabase'da jadval yaratib, formani unga ulang.",
      "Loyihani Vercel'ga deploy qiling.",
      "Domen bog'lang yoki bepul subdomen bilan jonli URL'ni tekshiring.",
    ],
    tools: {
      items: [
        { name: "Supabase", free: "Bepul: Postgres DB, auth, storage", pro: "Pro (~$25/oy): ko'proq hajm va limit" },
        { name: "Vercel", free: "Bepul (Hobby): deploy + preview URL", pro: "Pro: jamoa, katta trafik, tez build" },
        { name: "Neon Postgres", free: "Bepul: serverless Postgres", pro: "Launch/Scale: ko'proq quvvat" },
      ],
    },
    prompt: {
      title: "DB ulash rejasi",
      text: "Formam ma'lumotini Supabase'ga saqlamoqchiman. Maydonlar: [ro'yxat].\nJadval sxemasini yoz, ulash uchun kodni ko'rsat va xavfsizlik (RLS) haqida eslat. Keyin Vercel'ga deploy qadamlarini sanab ber.",
    },
    task: {
      text: "Mahsulotingizni DB'ga ulab, internetga deploy qiling va jonli URL'ni sinang.",
      checklist: [
        "Ma'lumot DB'ga saqlanadi.",
        "Loyiha Vercel'ga deploy qilingan.",
        "Jonli URL ishlaydi.",
        "Asosiy oqimni jonli saytda sinadingiz.",
      ],
    },
  }),
  6: labLesson({
    overview:
      "Backend va API — mahsulotning 'aqli'. Bugun API nima, so'rov-javob qanday ishlaydi va o'z API endpoint'ingizni yaratishni o'rganasiz.",
    keyPoint:
      "API — frontend va ma'lumot/servis orasidagi shartnoma. Har endpoint aniq kirish va chiqishga ega bo'lsin.",
    steps: [
      "Oddiy API endpoint yarating (masalan ma'lumot qaytaradigan).",
      "Frontend'dan shu endpoint'ga so'rov yuboring.",
      "Xato holatlarini va status kodlarni to'g'ri qaytaring.",
    ],
    tools: {
      items: [
        { name: "Vercel Functions", free: "Bepul (Hobby): serverless API", pro: "Pro: ko'proq resurs va limit" },
        { name: "Cursor / Claude Code", free: "Bepul: API kodi generatsiya", pro: "Pro: tez va izchil" },
      ],
    },
    prompt: {
      title: "API endpoint generatori",
      text: "Menga [vazifa] uchun API endpoint kerak (Next.js route handler / Vercel Function).\nKirish: [ma'lumot]. Chiqish: [format].\nXato holatlarini ham qaytar. Xavfsizlik va validatsiyani hisobga ol. Kodni izohlar bilan yoz.",
    },
    task: {
      text: "Mahsulotingiz uchun ishlaydigan bitta API endpoint yaratib, frontend'ga ulang.",
      checklist: [
        "Endpoint aniq kirish/chiqishga ega.",
        "Frontend'dan so'rov ishlaydi.",
        "Xato holatlari qaytariladi.",
        "Validatsiya qo'shilgan.",
      ],
    },
  }),
  7: labLesson({
    overview:
      "LLM API — ilovangizga sun'iy intellekt qo'shadi. Bugun LLM'ga so'rov yuborish va structured output (aniq JSON format) olishni o'rganasiz. Bu AI funksiyalarini ishonchli qiladi.",
    keyPoint:
      "AI natijasi dasturga uzatilsa, erkin matn emas, aniq struktura (JSON schema) so'rang — shunda natija barqaror ishlanadi.",
    steps: [
      "LLM API'ga oddiy so'rov yuboring (masalan matnni xulosalash).",
      "Structured output (JSON schema) bilan aniq format so'rang.",
      "Natijani ilova ichida ishlatib, xatoga chidamli qiling.",
    ],
    tools: {
      items: [
        { name: "Anthropic / OpenAI API", free: "Bepul: cheklangan sinov krediti", pro: "To'lovli: token bo'yicha, ishlab chiqarish uchun" },
        { name: "Vercel AI SDK + AI Gateway", free: "Bepul, ochiq manba SDK; Gateway sinov krediti", pro: "Gateway: ko'p provayder, fallback, kuzatuv" },
      ],
    },
    prompt: {
      title: "Structured output so'rovi",
      text: "LLM'dan [vazifa] natijasini quyidagi JSON schema bo'yicha qaytar:\n{ \"maydon1\": \"...\", \"maydon2\": [\"...\"] }\nFaqat shu formatda javob ber. Agar ma'lumot yetmasa, bo'sh qiymat qo'y. Kirish: [ma'lumot].",
    },
    task: {
      text: "Ilovangizga LLM API orqali structured output qaytaradigan bitta AI funksiya qo'shing.",
      checklist: [
        "LLM API so'rovi ishlaydi.",
        "Natija aniq JSON strukturada.",
        "Ilova natijani to'g'ri ishlaydi.",
        "Xato/bo'sh holatga chidamli.",
      ],
    },
  }),
  8: labLesson({
    overview:
      "Authentication foydalanuvchini taniydi va ma'lumotini himoya qiladi. Bugun login/ro'yxatdan o'tish, foydalanuvchi ma'lumotlari va shaxsiy AI funksiyani birlashtirasiz.",
    keyPoint:
      "Foydalanuvchi ma'lumotini himoyalang: har so'rovda kim ekanini tekshiring (server tomonda). Maxfiy kalitlar hech qachon client kodida turmasin.",
    steps: [
      "Auth qo'shing (login/register).",
      "Har foydalanuvchining o'z ma'lumotini saqlang va ko'rsating.",
      "AI funksiyani foydalanuvchi kontekstiga bog'lang.",
    ],
    tools: {
      items: [
        { name: "Supabase Auth", free: "Bepul: email/parol, OAuth, RLS", pro: "Pro: ko'proq foydalanuvchi va limit" },
        { name: "Clerk", free: "Bepul: 10k oylik faol foydalanuvchi", pro: "Pro: qo'shimcha imkoniyat va hajm" },
        { name: "Anthropic / OpenAI API", free: "Sinov krediti", pro: "To'lovli: ishlab chiqarish uchun" },
      ],
    },
    prompt: {
      title: "Auth + shaxsiy AI",
      text: "Ilovamga [Supabase/Clerk] bilan login/register qo'sh. Har foydalanuvchi o'z [ma'lumot]ini ko'rsin.\nSo'ng foydalanuvchi ma'lumotidan foydalanadigan AI funksiya qo'sh: [tavsif]. Xavfsizlik: so'rov server tomonda tekshirilsin, kalitlar env'da bo'lsin.",
    },
    task: {
      text: "Login/register va foydalanuvchiga xos AI funksiyani ilovangizga qo'shing.",
      checklist: [
        "Login/register ishlaydi.",
        "Har foydalanuvchi o'z ma'lumotini ko'radi.",
        "AI funksiya foydalanuvchi kontekstida ishlaydi.",
        "Kalitlar server tomonda, xavfsiz.",
      ],
    },
  }),
  9: labLesson({
    overview:
      "Telegram bot — mahsulotingizni eng oson kanalga olib kiradi. Bugun bot arxitekturasi, komandalar va webhook orqali serverga ulanishni o'rganasiz.",
    keyPoint:
      "Webhook so'rovi haqiqatan Telegram'dan kelganini tekshiring (secret). Bot avval bitta vazifani mukammal bajarsin.",
    steps: [
      "BotFather'dan bot yarating va token oling.",
      "Asosiy komandalar (/start, /help) va javoblarni sozlang.",
      "Botni webhook orqali serverga (Vercel) ulang.",
    ],
    tools: {
      items: [
        { name: "Telegram Bot API", free: "To'liq bepul: bot, komanda, media", pro: "—", note: "Telegram bot infratuzilmasi bepul" },
        { name: "grammY / Telegraf", free: "Bepul, ochiq manba framework", pro: "—" },
        { name: "Vercel", free: "Bepul (Hobby): webhook hosting", pro: "Pro: doimiy, katta yuklama" },
      ],
    },
    prompt: {
      title: "Bot skeleti",
      text: "Menga Telegram bot skeletini yoz (grammY, Vercel webhook).\nKomandalar: /start, /help va [asosiy vazifa].\nWebhook secret bilan tekshiruv qo'sh. Token env'da bo'lsin. Har qadamni izohla.",
    },
    task: {
      text: "Ishlaydigan Telegram bot yarating: kamida /start va bitta foydali komanda.",
      checklist: [
        "Bot BotFather orqali yaratildi.",
        "Komandalar javob beradi.",
        "Webhook serverga ulangan.",
        "Secret bilan tekshiruv bor.",
      ],
    },
  }),
  10: labLesson({
    overview:
      "Multimodal bot matn, rasm va ovozni tushunadi. Bugun botga AI qo'shib, foydalanuvchi yuborgan rasm va ovozni ham qayta ishlashni o'rganasiz.",
    keyPoint:
      "Har input turini alohida ishlang: matn → LLM, rasm → vision, ovoz → transkripsiya. Foydalanuvchiga aniq javob qaytaring.",
    steps: [
      "Botga matnli AI javobini qo'shing (LLM).",
      "Rasm yuborilganda uni tahlil qiling (vision).",
      "Ovozli xabarni matnga aylantirib javob bering.",
    ],
    tools: {
      items: [
        { name: "Anthropic / OpenAI API", free: "Sinov krediti: matn + vision", pro: "To'lovli: ishlab chiqarish uchun" },
        { name: "Whisper / transkripsiya", free: "Ochiq manba yoki sinov krediti", pro: "API: ishonchli ovoz→matn" },
      ],
    },
    prompt: {
      title: "Multimodal handler",
      text: "Telegram botimga multimodal qo'llab-quvvatlash qo'sh:\n- matn → LLM javobi\n- rasm → vision bilan tavsif/tahlil\n- ovoz → transkripsiya, keyin javob\nHar tur uchun alohida handler yoz. Xato holatiga chidamli qil.",
    },
    task: {
      text: "Botingizni matn, rasm va ovozni tushunadigan qilib kengaytiring.",
      checklist: [
        "Matnli AI javobi ishlaydi.",
        "Rasm tahlili ishlaydi.",
        "Ovoz matnga aylanadi.",
        "Har tur uchun aniq javob qaytariladi.",
      ],
    },
  }),
  11: labLesson({
    overview:
      "Endi botni ma'lumotlar bazasi va web-app bilan bog'lab, serverga doimiy deploy qilasiz. Bot va web-app bir xil ma'lumotni ko'radi.",
    keyPoint:
      "Foydalanuvchini barqaror ID (Telegram user/chat ID) orqali ajrating. Webhook idempotent bo'lsin — bir update qayta kelsa, amal takrorlanmasin.",
    steps: [
      "Botni Supabase'ga ulang (foydalanuvchi va ma'lumot saqlash).",
      "Bot va web-app bir xil ma'lumotni ishlatishini ta'minlang.",
      "Botni doimiy ishlaydigan qilib deploy qiling.",
    ],
    tools: {
      items: [
        { name: "Supabase", free: "Bepul: bot ma'lumotlari uchun DB", pro: "Pro: ko'proq hajm/limit" },
        { name: "Vercel", free: "Bepul: doimiy webhook", pro: "Pro: katta yuklama va barqarorlik" },
      ],
    },
    prompt: {
      title: "Bot + DB ulanishi",
      text: "Telegram botimni Supabase'ga ulamoqchiman. Har foydalanuvchi Telegram ID orqali saqlansin.\nJadval sxemasini yoz, saqlash/o'qish kodini ko'rsat va webhook idempotent bo'lishini ta'minla. Web-app ham shu ma'lumotni ko'rsin.",
    },
    task: {
      text: "Botni DB va web-app bilan bog'lab, doimiy deploy qiling.",
      checklist: [
        "Bot ma'lumotni DB'ga saqlaydi.",
        "Web-app bir xil ma'lumotni ko'radi.",
        "Foydalanuvchi barqaror ID bilan ajratiladi.",
        "Bot doimiy ishlaydi (deploy qilingan).",
      ],
    },
  }),
  12: labLesson({
    overview:
      "Workflow va AI agent — o'xshash, lekin farqli. Bugun tayyor qadamli workflow bilan mustaqil qaror qabul qiladigan agent orasidagi farqni va qachon qaysi biri kerakligini o'rganasiz.",
    keyPoint:
      "Workflow — oldindan belgilangan qadamlar. Agent — maqsad berilib, qadamlarni o'zi tanlaydi. Ko'p vazifaga aniq workflow yetadi; agent murakkab, ochiq vazifalar uchun.",
    steps: [
      "Bir vazifani avval qat'iy workflow sifatida yozing.",
      "Keyin uni agent yondashuviga aylantiring (maqsad + tool'lar).",
      "Qaysi biri ishonchliroq va arzonroq ekanini baholang.",
    ],
    tools: {
      items: [
        { name: "Vercel AI SDK", free: "Bepul, ochiq manba: agent/workflow", pro: "AI Gateway bilan kuzatuv/fallback" },
        { name: "Anthropic / OpenAI API", free: "Sinov krediti", pro: "To'lovli: ishlab chiqarish" },
      ],
    },
    prompt: {
      title: "Workflow vs agent tahlili",
      text: "Vazifa: [tavsif].\n1) Buni qat'iy workflow (aniq qadamlar) sifatida yoz.\n2) Keyin agent yondashuvida yoz (maqsad + kerakli tool'lar).\nHar biri uchun: qachon mos, qanday xavf, taxminiy xarajat. Tavsiya ber.",
    },
    task: {
      text: "Bir real vazifani ham workflow, ham agent sifatida loyihalab, tavsiya yozing.",
      checklist: [
        "Workflow versiyasi yozildi.",
        "Agent versiyasi yozildi.",
        "Farqlari (xavf, xarajat) baholandi.",
        "Asoslangan tavsiya berildi.",
      ],
    },
  }),
  13: labLesson({
    overview:
      "Function calling AI'ga tashqi tool'lardan foydalanish imkonini beradi. Bugun agentga tool bog'lab, u ma'lumot olishi yoki amal bajarishini o'rganasiz.",
    keyPoint:
      "Tool'ga eng kam kerakli ruxsatni bering (least privilege). Har tool aniq kirish/chiqishga va tavsifga ega bo'lsin.",
    steps: [
      "Bitta oddiy tool yozing (masalan ma'lumot qidirish yoki hisoblash).",
      "Uni AI SDK orqali agentga ulang.",
      "Agent qachon qaysi tool'ni chaqirishini kuzating.",
    ],
    tools: {
      items: [
        { name: "Vercel AI SDK (tools)", free: "Bepul, ochiq manba: tool/function calling", pro: "Gateway: kuzatuv va ko'p provayder" },
        { name: "Tashqi API'lar", free: "Ko'pi bepul tier beradi", pro: "To'lovli: yuqori limit" },
      ],
    },
    prompt: {
      title: "Tool ta'rifi",
      text: "Agentimga [vazifa] uchun tool qo'shmoqchiman.\nTool nomi, tavsifi, kirish parametrlari (schema) va chiqish formatini yoz.\nAgent uni qachon chaqirishini ham izohla. Least privilege qoidasiga amal qil.",
    },
    task: {
      text: "Agentingizga kamida bitta ishlaydigan tool ulang va sinang.",
      checklist: [
        "Tool aniq schema bilan yozilgan.",
        "Agentga ulangan va chaqiriladi.",
        "Kirish/chiqish to'g'ri.",
        "Ruxsat cheklangan (least privilege).",
      ],
    },
  }),
  14: labLesson({
    overview:
      "RAG, xotira va MCP — agentni ma'lumot bilan boyitadi. Bugun hujjatlardan javob topish (RAG), suhbatni eslash (xotira) va MCP orqali tashqi manbalarga ulanishni o'rganasiz.",
    keyPoint:
      "RAG'da javob manba hujjatga asoslansin: model 'o'ylab topmasin'. Ma'lumotni embedding qilib, tegishli qismini kontekstga qo'shing.",
    steps: [
      "Bir necha hujjatni embedding qilib, vektor bazaga saqlang (Supabase pgvector).",
      "Savolga tegishli qismni topib, agentga kontekst sifatida bering.",
      "Suhbat xotirasini va (imkoni bo'lsa) MCP ulanishini qo'shing.",
    ],
    tools: {
      items: [
        { name: "Supabase pgvector", free: "Bepul: embedding saqlash + qidiruv", pro: "Pro: katta hajm" },
        { name: "Embedding API", free: "Sinov krediti", pro: "To'lovli: katta hujjat bazasi" },
        { name: "MCP serverlar", free: "Bepul, ochiq manba: tashqi manba ulash", pro: "—" },
      ],
    },
    prompt: {
      title: "RAG oqimi",
      text: "Menga RAG oqimini qur: [hujjatlar] dan javob topadigan.\n1) hujjatlarni bo'lib embedding qil, 2) savolga o'xshash qismni top, 3) shu kontekst bilan javob ber va manbani ko'rsat.\nSupabase pgvector ishlat. Kodni bosqichma-bosqich izohla.",
    },
    task: {
      text: "Hujjatlardan javob topadigan RAG oqimini agentingizga qo'shing.",
      checklist: [
        "Hujjatlar embedding qilib saqlangan.",
        "Savolga tegishli qism topiladi.",
        "Javob manbaga asoslanadi.",
        "Xotira yoki MCP ulanishi sinaldi.",
      ],
    },
  }),
  15: labLesson({
    overview:
      "Ishonchli agent — xavfsiz agent. Bugun human approval (inson tasdig'i), evals (sifat o'lchash), xavfsizlik va monitoringni o'rganasiz. Bu mahsulotni ishlab chiqarishga tayyorlaydi.",
    keyPoint:
      "Qaytarib bo'lmas amal (pul yuborish, ma'lumot o'chirish) oldidan inson tasdig'ini talab qiling. Agent qarorlarini loglang — audit qilib bo'ladigan bo'lsin.",
    steps: [
      "Xavfli qadamlarga human approval qo'shing.",
      "Bir necha test misolida agentni baholang (evals).",
      "Log va monitoring qo'shib, xatolarni kuzating.",
    ],
    tools: {
      items: [
        { name: "Vercel AI Gateway", free: "Sinov: so'rov kuzatuvi, xarajat", pro: "Kuzatuv, fallback, monitoring" },
        { name: "Log/monitoring", free: "Vercel loglari, oddiy eval skriptlari", pro: "Kengaytirilgan monitoring xizmatlari" },
      ],
    },
    prompt: {
      title: "Xavfsizlik va eval rejasi",
      text: "Agentim [vazifa] bajaradi. Menga:\n1) qaysi qadamlar human approval talab qilishini ayt,\n2) 5 ta eval test-keysi taklif qil,\n3) qanday log va monitoring kerakligini yoz.\nXavfli holatda xavfsiz default (to'xtab, tasdiq so'rash) bo'lsin.",
    },
    task: {
      text: "Agentingizga human approval, bir nechta eval va monitoring qo'shing.",
      checklist: [
        "Xavfli qadamlar tasdiq talab qiladi.",
        "Kamida bir necha eval test-keys ishladi.",
        "Loglar yozilmoqda.",
        "Xavfsiz default holat mavjud.",
      ],
    },
  }),
  16: labLesson({
    overview:
      "Capstone — website, Telegram bot va AI agentni bitta mahsulotga birlashtirasiz. Bu ma'lumot topadigan, qaror chiqaradigan va amal bajaradigan to'liq AI mahsulot bo'ladi.",
    keyPoint:
      "Capstone — 'kurs o'tdim' emas, ko'rsatadigan real mahsulot. Uchala qism (web + bot + agent) bir xil ma'lumot va mantiqda ishlasin.",
    steps: [
      "Yakuniy loyiha variantini tanlang (masalan AI sotuv agenti, RAG bot, ta'lim yordamchisi).",
      "Website, bot va agentni bitta ma'lumot manbasiga bog'lang.",
      "To'liq oqimni sinab, portfolio uchun tavsif yozing.",
    ],
    prompt: {
      title: "Capstone integratsiya tekshiruvi",
      text: "Mening capstone loyiham: [tavsif]. Qismlar: website, Telegram bot, AI agent.\nUchalasi bir xil ma'lumotni ko'radimi? Agent xavfsizmi (approval, log)? Oqim boshdan oxirigacha ishlaydimi?\nHar biri bo'yicha tekshiruv ro'yxati va yaxshilash taklifini ber.",
    },
    task: {
      text: "Website + Telegram bot + AI agentni bitta ishlaydigan mahsulotga birlashtirib, portfolioga qo'ying.",
      checklist: [
        "Yakuniy loyiha varianti tanlandi.",
        "Uch qism bir ma'lumot manbasiga ulangan.",
        "To'liq oqim boshdan oxirigacha ishlaydi.",
        "Portfolio tavsifi yozildi.",
      ],
    },
  }),
};
