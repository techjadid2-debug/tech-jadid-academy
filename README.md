# Tech Jadid Akademiyasi

O'zbek tilidagi jonli + platforma AI kursi. Ilova Next.js 16, Supabase va
Vercel bilan ishlaydi. Bosh sahifadagi qisqa forma leadni call-center CRM'iga
yuboradi; sotuvchi qo'ng'iroq, follow-up va to'lovni yuritib, kursni ochadi.

## Hozirgi Oqim

1. Tashrif buyuruvchi kurslar va har ikki bepul 1-darsni ko'radi.
2. Ism, telefon va kursni qoldiradi; lead `/sotuvchi` CRM'iga tushadi.
3. Sotuvchi leadni oladi, qo'ng'iroq/follow-up qaydlarini yuritadi.
4. To'lovdan keyin CRM o'quvchi loginini, payment va kurs kirishini bir oqimda yaratadi.
5. O'quvchi `/login` orqali kirib darslarni ko'radi.
6. Admin `/admin`da kontent, seller hisoblari, CRM va homeworkni boshqaradi.

`PUBLIC_REGISTRATION_ENABLED=false` bo'lganda yangi public ariza/cohort oqimi
yopiq. Oldin yaratilgan pending checkout va Telegram tasdiqlashlar yakunlanishi
uchun legacy route'lar saqlangan.

Kurs Google Meet'da kechki jonli darslar sifatida o'tadi. Platformada har dars uchun
nazariy va amaliy qism, tayyor promptlar, uy vazifasi hamda mavzudan keyingi
test bor. AI sandbox Gateway sozlanganda faqat tanlangan darslarda kunlik limit
bilan ishlaydi. Ustoz e'lon, jadval, Meet, YouTube yozuvi, davomat va homework
feedbackini boshqaradi. Sertifikat uchun 16 dars, kamida 80% quiz va 80+ ballik
ustoz tasdiqlagan capstone talab qilinadi.

## Sozlash

1. Supabase SQL Editor'da migratsiyalarni ketma-ket qo'llang:
   `0001_init.sql` dan `0017_sales_crm.sql` gacha, keyin `supabase/seed.sql`.
   `0015_seller_role.sql` tugagach `0016` va `0017`ni ketma-ket alohida qo'llang.
2. `.env.local` va Vercel Environment Variables'ga quyidagilarni kiriting:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
   PAYMENT_CARD_NUMBER=
   PAYMENT_CARD_HOLDER=
   PAYMENT_TELEGRAM_URL=https://t.me/your_username
   ENABLE_DEMO_MODE=false
   PUBLIC_REGISTRATION_ENABLED=false
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
npm run typecheck
npm test
npm run build
```

Yoki hammasi: `npm run check`.

Production migratsiyalaridan keyin, deploydan oldin:

```bash
npm run preflight:production
```

## Muhim Eslatmalar

- `SUPABASE_SERVICE_ROLE_KEY` faqat serverda, `.env.local` va Vercel secret sifatida bo'lishi kerak.
- O'quvchi parolini admin yoki faqat o'sha hisobni yaratgan sotuvchi yangilaydi.
- Demo rejim faqat local developmentda `ENABLE_DEMO_MODE=true` bilan ishlaydi.
- Credentiallar README/HANDOFF/gitga yozilmaydi; rotatsiyada eski sessiyalar ham bekor qilinadi.
- Vercel Hobby tijoriy foydalanishni cheklaydi. Ommaviy pullik loyiha uchun ushbu platforma cheklovini hisobga oling.

## Seller-first launch checklist

1. Production domenini `NEXT_PUBLIC_APP_URL`ga qo'ying va barcha environment variable'larni Vercel'da Production muhiti uchun kiriting.
2. Telegram bot ishlatilsa, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`,
   `TELEGRAM_ADMIN_IDS` va `TELEGRAM_WEBHOOK_SECRET`ni kiriting, so'ng
   `npm run telegram:set-webhook`ni bir marta ishga tushiring.
3. `/admin`da test seller yarating, bosh sahifadan test lead yuboring va `/sotuvchi`da uni oling.
4. Lead izohi, follow-up, to'lov, student login, dars kirishi va seller ownershipni tekshiring.
5. Mavjud pending order bo'lsa checkout va Telegram tasdiqlashni yakunlab ko'ring.
6. Jonli darsdan keyin YouTube `unlisted` video ID'sini cohort darsiga kiriting.
   Har playerda o'quvchining `TJ-XXXXXXXX` watermark'i yuradi. Bu tarqatishni
   tiyadi, lekin YouTube havolasini mutlaq DRM darajasida yashirmaydi.

## Rollar

- Admin `/admin`da mavjud loginni `instructor` roliga o'tkazadi.
- Admin `/admin`da seller yaratadi va seller parolini yangilaydi.
- Seller `/sotuvchi`da faqat o'zi yaratgan studentlar va ularning kurslarini boshqaradi.
- Admin yoki ustoz `/teacher`da cohort, jadval, e'lon va to'lovlarni boshqaradi.
- Ustoz `/admin/homework` orqali `submitted` va AI baholagan vazifalarni tekshiradi.
- O'quvchi kabinetida keyingi jonli dars, Telegram guruh, e'lonlar va checkout ko'rinadi.

## Vercel

Lokal Vercel CLI eski bo'lsa, agentic imkoniyatlar va Next.js 16 mosligi uchun yangilang:

```bash
npm i -g vercel@latest
```
