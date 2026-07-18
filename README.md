# Tech Jadid Akademiyasi

O'zbek tilidagi amaliy AI ta'lim platformasi. Ilova Next.js 16, Supabase va
Vercel bilan ishlaydi. Xaridor karta orqali o'tkazma qiladi, chekni admin
Telegram'iga yuboradi, admin esa login-parol yaratib kursga kirishni ochadi.

## Hozirgi Oqim

1. Tashrif buyuruvchi kurs dasturi, jonli dars formati va tariflarni ko'radi.
2. Xaridor tarifni tanlaydi, karta rekvizitlarini oladi va chekni Telegram'ga yuboradi.
3. Admin `/admin` sahifasida o'quvchi uchun login/parol yaratadi hamda uni Telegram guruhiga qo'shadi.
4. Bir martalik to'lov 2 oylik kursni 600 000 so'mga, oyma-oy tarif esa har oy 350 000 so'mga ochadi.
5. Ikkinchi oy to'lovi admin tomonidan tasdiqlanganda kirish yana 30 kunga uzaytiriladi.

Kurs Google Meet'da kechki jonli darslar sifatida o'tadi. Platformada har dars uchun
slaydlar, nazariy va amaliy qism, tayyor promptlar, uy vazifasi hamda mavzudan keyingi
test bor. AI sandbox hozircha faol emas. Progress, gamifikatsiya va sertifikat Supabase
real rejimi yoqilganda ishlaydi.

## Sozlash

1. Supabase SQL Editor'da migratsiyalarni ketma-ket qo'llang:
   `0001_init.sql` dan `0009_lesson_assessments.sql` gacha, keyin `supabase/seed.sql`.
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

3. Bir marta administrator yarating:

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
3. Production deploydan keyin bitta test buyurtma qiling: karta rekvizitlari,
   Telegram havolasi, admin hisob yaratishi, login va 1–8/to'liq kirishni tekshiring.
4. To'lov tasdiqlangach o'quvchini Telegram guruhiga qo'shing, login/parolini yuboring
   va birinchi Google Meet vaqtini xabardor qiling.
