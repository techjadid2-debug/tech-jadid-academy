# Tech Jadid — AI O'rganish Akademiyasi

O'zbek tilida amaliy AI ta'limi platformasi. **Bepul stack** (Next.js + Supabase +
Cloudflare R2), avtomatik to'lov (Payme/Click/Uzum), himoyalangan video.

Boshlang'ich kurs: **Sun'iy Intellekt Asoslari** (16 dars, 6 modul).

## Texnologiyalar

| Qatlam | Xizmat |
|---|---|
| Frontend/Backend | Next.js 16 (App Router) + React 19 |
| Uslub | Custom dizayn tizimi (Apple/Google uslubi) — `globals.css` |
| DB + Auth + Storage | Supabase (bepul tier) |
| Video | Cloudflare R2 signed URL + dinamik watermark (kelajakda Bunny DRM) |
| To'lov | Payme + Click + Uzum |
| Deploy | Vercel |

## DEMO rejim (hozir)

Loyiha **hech qanday tashqi xizmatsiz** ishlaydi. Env o'zgaruvchilari bo'sh bo'lsa:

- **Auth** — ism + telefon/email orqali demo kirish (cookie'da saqlanadi)
- **Enrollment** — to'lovdan keyin kirish cookie'da ochiladi
- **To'lov** — mock checkout ("demo tasdiqlash" tugmasi to'liq oqimni yakunlaydi)
- **Video** — "video tez orada" placeholder (kirish nazorati va watermark ishlaydi)

Bu to'liq foydalanuvchi oqimini (landing → sotib olish → dars ko'rish) darhol sinash imkonini beradi.

## Ishga tushirish

```bash
npm install
npm run dev
# http://localhost:3000
```

### To'liq oqimni sinash
1. `/` — landing sahifa
2. "Kursni ko'rish" → `/kurs/ai-asoslari`
3. Tarif + to'lov usuli tanlab "To'lash" → login (demo) → checkout
4. "Demo tasdiqlash" → kurs ochiladi → `/learn/ai-asoslari/1`
5. `/dashboard` — kabinet; admin uchun `admin@techjadid.uz` bilan kiring

## Real rejimga o'tish

1. **Supabase**: loyiha yarating, `supabase/migrations/0001_init.sql` + `supabase/seed.sql`
   ni qo'llang, `.env.local`ga URL/kalitlarni qo'ying. `src/lib/auth.ts` va
   `src/lib/access.ts` cookie o'rniga Supabase'ga o'tkaziladi.
2. **Video**: Cloudflare R2 bucket + `R2_PUBLIC_BASE`, `VIDEO_SIGN_SECRET`. `src/lib/video.ts`
   allaqachon signed URL beradi.
3. **To'lov**: har provayder kalitlarini `.env.local`ga qo'ying;
   `src/app/api/webhooks/*` dagi `TODO(real)` bloklarini yakunlang.
4. **Cron**: `vercel.json` cron `/api/cron/renew-subscriptions` ni chaqiradi.

## Xavfsizlik (video)

Reja: signed URL (muddat+imzo) + dinamik watermark (foydalanuvchi telefoni) + domen
qulfi + seans cheklovi. Daromad kelgach Bunny DRM (Widevine/PlayReady/FairPlay).

## Loyiha tuzilmasi

```
src/
  app/            # sahifalar + API route'lar (App Router)
    kurs/[slug]/  # kurs sahifasi + sotib olish
    learn/        # himoyalangan video player
    checkout/     # to'lov (mock)
    api/webhooks/ # payme/click/uzum
  components/     # UI komponentlar
  lib/            # course-data, auth, access, video, payments
supabase/         # migrations + seed
_reference/       # asl landing HTML (arxiv)
```
