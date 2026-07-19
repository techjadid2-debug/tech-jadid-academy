# Tech Jadid Akademiyasi

O'zbek tilidagi 8 haftalik jonli + platforma AI kursi. Ilova Next.js 16,
Supabase va Vercel bilan ishlaydi. O'quvchi hisob ochib ariza yuboradi, ustoz
guruh va tarifni biriktiradi, chek tasdiqlangach kurs hamda cohort jadvali ochiladi.

## Hozirgi Oqim

1. Tashrif buyuruvchi kurs dasturi, jonli dars formati va tariflarni ko'radi.
2. Ustoz `/teacher` sahifasida 8 haftalik cohort yaratadi, arizani guruh va tarifga bog'lab shaxsiy checkout tayyorlaydi.
3. O'quvchi karta orqali o'tkazadi va buyurtmaga bog'langan Telegram havolasi orqali chek yuboradi.
4. Telegram yoki ustoz tasdig'i payment, enrollment va cohort membership'ni birga faollashtiradi.
5. Darslar haftasiga ikki marta `release_at` bo'yicha ochiladi; test progressni o'lchaydi, keyingi darsni bloklamaydi.

Kurs Google Meet'da kechki jonli darslar sifatida o'tadi. Platformada har dars uchun
slaydlar, nazariy va amaliy qism, tayyor promptlar, uy vazifasi hamda mavzudan keyingi
test bor. AI sandbox Gateway sozlanganda faqat tanlangan darslarda kunlik limit
bilan ishlaydi. Ustoz e'lon, jadval, Meet, YouTube yozuvi, davomat va homework
feedbackini boshqaradi. Sertifikat uchun 16 dars, kamida 80% quiz va 80+ ballik
ustoz tasdiqlagan capstone talab qilinadi.

## Sozlash

1. Supabase SQL Editor'da migratsiyalarni ketma-ket qo'llang:
   `0001_init.sql` dan `0013_cohorts_and_paid_enrollment.sql` gacha, keyin `supabase/seed.sql`.
2. `.env.local` va Vercel Environment Variables'ga quyidagilarni kiriting:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
   PAYMENT_CARD_NUMBER=
   PAYMENT_CARD_HOLDER=
   PAYMENT_TELEGRAM_URL=https://t.me/your_username
   ```

3. Kontentni DB'ga sinxronlang va bir marta administrator yarating:

   ```bash
   npm run seed:content
   npm run seed:quizzes
   ```

   ```bash
   ADMIN_LOGIN=admin ADMIN_INITIAL_PASSWORD='kuchli-parol' npm run bootstrap:admin
   ```

   Script tugagach `ADMIN_INITIAL_PASSWORD`ni `.env.local`dan o'chiring. Bu login va
   parol bilan `/login` orqali admin panelga kiring.

## Lokal Ishga Tushirish

```bash
npm install
npm run dev
```

Tekshiruvlar:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Muhim Eslatmalar

- `SUPABASE_SERVICE_ROLE_KEY` faqat serverda, `.env.local` va Vercel secret sifatida bo'lishi kerak.
- O'quvchi parolini faqat admin yangilaydi; parol tiklash email orqali yuborilmaydi.
- Vercel Hobby tijoriy foydalanishni cheklaydi. Ommaviy pullik loyiha uchun ushbu platforma cheklovini hisobga oling.

## Jonli guruh launch checklist

1. Production domenini `NEXT_PUBLIC_APP_URL`ga qo'ying va barcha environment variable'larni Vercel'da Production muhiti uchun kiriting.
2. Telegram bot ishlatilsa, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`,
   `TELEGRAM_ADMIN_IDS` va `TELEGRAM_WEBHOOK_SECRET`ni kiriting, so'ng
   `npm run telegram:set-webhook`ni bir marta ishga tushiring.
3. Production deploydan keyin bitta test ariza va buyurtma qiling: karta rekvizitlari,
   order'ga bog'langan Telegram havolasi, paid aktivatsiya va jadval bo'yicha kirishni tekshiring.
4. `/teacher`da cohort yarating. 16 dars haftasiga ikki martadan avtomatik jadval qilinadi; kerak bo'lsa Meet va vaqtlarni tahrirlang.
5. Test arizasi bilan shaxsiy checkout, Telegram chek tasdig'i, cohort membership,
   schedule access, homework va ustoz feedbackini end-to-end tekshiring.
6. Jonli darsdan keyin YouTube `unlisted` video ID'sini cohort darsiga kiriting.
   Har playerda o'quvchining `TJ-XXXXXXXX` watermark'i yuradi. Bu tarqatishni
   tiyadi, lekin YouTube havolasini mutlaq DRM darajasida yashirmaydi.

## Ustoz va cohort

- Admin `/admin`da mavjud loginni `instructor` roliga o'tkazadi.
- Admin yoki ustoz `/teacher`da cohort, jadval, e'lon va to'lovlarni boshqaradi.
- Ustoz `/admin/homework` orqali `submitted` va AI baholagan vazifalarni tekshiradi.
- O'quvchi kabinetida keyingi jonli dars, Telegram guruh, e'lonlar va checkout ko'rinadi.

## Vercel

Lokal Vercel CLI eski bo'lsa, agentic imkoniyatlar va Next.js 16 mosligi uchun yangilang:

```bash
npm i -g vercel@latest
```
