# HANDOFF — Tech Jadid Academy (ishni davom ettirish uchun)

> Bu hujjat ishni davom ettiruvchi agent (codex) uchun. Joriy holat, tasdiqlangan
> reja va rasm generatsiya promptlari shu yerda. Til: o'zbekcha.

## 1. Loyiha holati (qisqacha)

- **Stack:** Next.js 16 (App Router) + React 19 + Supabase + Vercel. Barcha UI/kontent o'zbekcha. `AGENTS.md`: Next 16 — `node_modules/next/dist/docs/` dan foydalaning.
- **DB:** production Supabase Frankfurt (`eu-central-1`) hududida. URL va kalitlar faqat `.env.local`/Vercel secretlarda saqlanadi; hujjatga yozilmaydi.
- **Kurslar:** `ai-video-creator` (4 modul / 16 dars), `ai-builder` (6 modul / 16 dars). Kontent + 160 viktorina DB'ga seed qilingan. Eski `ai-asoslari` unpublished.
- **Kontent manbasi (kod):** `src/lib/course-data.ts` (struktura + rows), `src/lib/content/{slug}.ts` (`labLesson` factory — boy content), `scripts/quiz-banks/{slug}.ts` (viktorina). Seed skriptlar: `npm run seed:content`, `npm run seed:quizzes`.
- **Deploy:** `vercel --prod --yes`. **Git remote YO'Q** — faqat lokal commit + Vercel CLI deploy. Jonli: https://tech-jadid-academy.vercel.app . Funksiyalar `fra1` (`vercel.json` `regions:["fra1"]`, DB yoni).
- **Admin (egasi):** login va parol password managerda saqlanadi. Qayta yaratish: `ADMIN_LOGIN=... ADMIN_INITIAL_PASSWORD='...' npm run bootstrap:admin`; ishlagach secretni muhitdan o'chiring.
- **Tekshiruv:** `npm run lint`, `npm test`, `npm run build`. Tashqi `curl` sandboxda bloklangan — jonli tekshiruvga **WebFetch** ishlating. Uzbek matnda kirillcha harf aralashmasin: `grep -nP '[\x{0400}-\x{04FF}]' <fayl>`.

## 2. AMALGA OSHIRILGAN YO'NALISH — rol-ajratish + slaydlarni olib tashlash

**Maqsad:** ikki rol aniq ajratiladi:
- **Sotuvchi (seller):** kim to'lov qilsa (to'lov platforma tashqarisida), o'sha odamga **kursni ochib beradi** (o'quvchi hisobi + kirish). Boshqa huquq YO'Q — tahrirlash/narx/quiz ko'rmaydi.
- **Egasi (admin = Abdulvosit):** kurslar, darslar, **vazifalar**, dars materiallarini tahrirlaydi + sotuvchi hisoblarini boshqaradi.

Plus: dars sahifasidagi **avto-slaydlar olib tashlanadi** (video yetarli). Boshqa funksiyalar (video, matn, viktorina, sandbox, uy vazifasi) qoladi.

### A. Avto-slaydlarni olib tashlash — BAJARILDI
- ✅ `src/app/learn/[slug]/[lessonId]/page.tsx`: `<LessonSlides>` import + JSX olib tashlandi.
- ✅ `src/components/lesson/LessonSlides.tsx` va `src/components/lesson/LessonInfographic.tsx` **o'chirildi**.
- ✅ Slaydlarga tegishli o'lik CSS olib tashlandi.

### B. Yangi `seller` roli — KOD TAYYOR
- Migratsiyalar: `0015_seller_role.sql`, keyin `0016_launch_hardening.sql`. Production DB'ga ketma-ket qo'llang.
- `src/lib/auth.ts`: `AppUser.role` (`~:25`) union'iga `"seller"` qo'shing; `getSupabaseUser` (`~:63`) profil roli `seller` bo'lsa saqlasin.
- Yordamchi `isSeller(user)` = `role === "seller" || role === "admin"` (`src/lib/auth.ts` yoki yangi `src/lib/roles.ts`).

### C. Sotuvchi paneli `/sotuvchi` — KOD TAYYOR
- `src/app/sotuvchi/page.tsx` + `src/app/sotuvchi/actions.ts`. `requireSeller` (seller yoki admin; aks holda `/dashboard`).
- Action **`openCourseAccess`**: kurs slug + o'quvchi (ism, login, parol, kontakt) → (1) `admin.auth.admin.createUser` + `profiles` (role `student`), (2) `grantAccess(userId, slug, "admin")` (doimiy kirish; `admin` source reconcile'ga tegilmaydi, to'lov yozuvi shart emas). **Mantiqni `src/app/admin/actions.ts:62` `createStudentAccount`dan qayta ishlating**, lekin to'lov insert'isiz va `requireSeller` bilan.
- UI: kurs tanlagich + o'quvchi forma → "Kursni ochish"; ochilgach login/parolni ko'rsatadi (sotuvchi xaridorga beradi). Ixtiyoriy: sotuvchi ochgan o'quvchilar ro'yxati + parol tiklash.
- **Faqat shu.** Kurs/dars tahrirlash, narx, quiz, cohort — YO'Q.

### D. Admin: sotuvchi hisobini yaratish — KOD TAYYOR
- `src/app/admin/actions.ts`: yangi `createSellerAccount` (login+parol, `role='seller'`) + sotuvchilar ro'yxati. `setInstructorRole` (`:197`) va `createStudentAccount` naqshlari.
- `src/app/admin/page.tsx`ga forma qo'shing. Sotuvchilar `/admin`ga kira olmaydi (tekshiruv bor: `admin/actions.ts:22-31`, `page.tsx` role check).

### E. Marshrutlash / nav — KOD TAYYOR
- `src/app/dashboard/page.tsx` (`~:84`): `isSeller(user)` bo'lsa "Sotuvchi paneli" (`/sotuvchi`) tugmasi (hozir `isTeacher` → "Ustoz kabineti"). Ixtiyoriy: `src/app/login/actions.ts` seller kirsa `/sotuvchi`ga default.

### Yakunda
`npm run lint && npm test && npm run build` yashil → commit → `vercel --prod --yes` → WebFetch bilan jonli tekshirish.

### Ixtiyoriy (hozir emas)
Self-serve `/register` ariza + `/teacher` cohort/to'lov oqimi endi ortiqcha (sotuvchi qo'lda ochadi) — keyin olib tashlash yoki dormant qoldirish mumkin.

---

## 3. RASM GENERATSIYA PROMPTLARI

**Kontekst:** hozir katalog kartalarida **SVG dizayn cover** ishlatilyapti (`src/components/course/CatalogCover.tsx`) — Higgsfield krediti (free, 0 kredit) tugagani uchun AI rasm generatsiya qilinmadi. Kredit yoki boshqa vosita (masalan `nano_banana_pro`, DALL·E, Midjourney, Flux) bo'lsa quyidagilarni generatsiya qilib rasmga almashtiring.

### 3a. Katalog cover bannerlari (kartalar tepasi) — asosiy
- **Fayllar:** `public/course/ai-video-creator/cover.webp`, `public/course/ai-builder/cover.webp`
- **O'lcham:** ~1600×700 (keng banner, ~16:7), **webp**. To'q navy fon light/dark saytga mos.
- **Ulash:** `src/components/course/CatalogCover.tsx`ni `next/image` bilan `/course/<slug>/cover.webp` ko'rsatadigan qilib o'zgartiring; rasm yuklanmasa hozirgi SVG/gradient fallback qolsin (`onError`).
- **Prompt — AI Video Creator:**
  > Clean modern 3D isometric illustration for an "AI Video Creator" online course cover banner. AI video creation theme: floating film clip frames, a glowing play button, a video camera, an editing timeline with clips, subtle AI spark nodes. Vibrant gradient with blue, red, yellow and green accent glows on a deep dark navy background. Polished professional ed-tech style, soft cinematic lighting, depth. No text, no letters. Wide 16:7 banner composition.
- **Prompt — AI Builder:**
  > Clean modern 3D isometric illustration for an "AI Builder" online course cover banner. Building-AI-products theme: a browser window with code, a chat bot speech bubble, connected agent/network nodes, a paper-plane messaging icon, small gears. Vibrant gradient with blue, red, yellow and green accent glows on a deep dark navy background. Polished professional ed-tech style, soft lighting, depth. No text, no letters. Wide 16:7 banner composition.

### 3b. Dars cover rasmlari (ixtiyoriy — hozir gradient fallback)
- **Fayllar:** `public/course/<slug>/lesson-NN/cover.webp` (+ `cover-dark.webp` dark tema uchun). NN = `01`..`16`.
- **O'lcham:** 16:9, ~1600×900, webp. `src/components/course/LessonCover.tsx` shu yo'lni o'qiydi; rasm bo'lmasa gradient fallback (buzuq rasm chiqmaydi).
- **Uslub izchil bo'lsin** (barcha 32 dars bitta illustration uslubida).
- **Prompt shabloni:**
  > Clean modern flat/3D illustration, ed-tech style, [DARS MAVZUSI], vibrant but professional, soft lighting, brand accent colors (blue/red/yellow/green), deep dark or light neutral background, no text, no letters. 16:9.
- Dars mavzulari `src/lib/course-data.ts`dagi dars nomlaridan olinadi. Masalan:
  - ai-video-creator/lesson-09 (Text-to-video): "...text prompt turning into moving video frames..."
  - ai-builder/lesson-09 (Telegram bot): "...a Telegram-style chat bot on a phone with command bubbles..."
  - ai-builder/lesson-14 (RAG/MCP): "...documents feeding into an AI brain with retrieval arrows..."

### 3c. OG / ijtimoiy rasm (ixtiyoriy)
- `src/app/opengraph-image.png` (yoki `opengraph-image.tsx`), ~1200×630.
- **Prompt:** katalog cover uslubida, ikkala kurs motivini (play + code/bot) birlashtirgan, deep navy + brand gradient, "no text" (matnni kod bilan qo'shing yoki matnsiz).

---

## 4. To'liq reja fayli
Batafsil reja: `~/.claude/plans/kurni-o-zgartiramiz-bu-yerda-peaceful-bunny.md` (bu hujjatning 2-bo'limi bilan bir xil mazmun).
