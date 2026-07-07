-- ============================================================================
-- Tech Jadid Akademiyasi — boshlang'ich sxema + RLS.
-- Supabase SQL editor'da yoki `supabase db push` orqali qo'llang.
-- ============================================================================

-- ---- ENUM tiplar ----
create type user_role as enum ('student', 'instructor', 'admin');
create type lesson_type as enum ('video', 'live', 'text', 'quiz');
create type enroll_source as enum ('lifetime', 'monthly', 'admin');
create type pay_provider as enum ('payme', 'click', 'uzum');
create type pay_status as enum ('pending', 'paid', 'canceled');
create type pay_kind as enum ('lifetime', 'monthly');

-- ---- Profiles (auth.users bilan 1:1) ----
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  telegram_id bigint,
  avatar_url text,
  role user_role not null default 'student',
  created_at timestamptz not null default now()
);

-- ---- Kurslar ----
create table courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  thumbnail text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---- Narx variantlari (lifetime / monthly) ----
create table pricing_options (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  kind pay_kind not null,
  label text not null,
  price_uzs integer not null,
  note text,
  unique (course_id, kind)
);

-- ---- Modullar ----
create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  "order" int not null,
  code text,
  title text not null,
  range_text text,
  accent text,
  unique (course_id, "order")
);

-- ---- Darslar ----
create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  "order" int not null,
  title text not null,
  type lesson_type not null default 'video',
  video_key text,          -- R2/Bunny kaliti
  youtube_id text,         -- bepul preview
  duration_sec int not null default 0,
  is_preview boolean not null default false,
  rows jsonb not null default '[]'::jsonb,
  unique (module_id, "order")
);

-- ---- Enrollments (kirish huquqi) ----
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  source enroll_source not null,
  expires_at timestamptz,  -- monthly uchun; lifetime uchun null
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ---- To'lovlar ----
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  amount_uzs integer not null,
  provider pay_provider not null,
  provider_txn_id text,
  status pay_status not null default 'pending',
  kind pay_kind not null,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_txn_id)   -- idempotency
);

-- ---- Dars progressi ----
create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  completed boolean not null default false,
  watched_seconds int not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- ---- Indekslar (10K scale) ----
create index idx_payments_txn on payments(provider, provider_txn_id);
create index idx_enrollments_user on enrollments(user_id, course_id);
create index idx_progress_user on lesson_progress(user_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
alter table profiles enable row level security;
alter table courses enable row level security;
alter table pricing_options enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table enrollments enable row level security;
alter table payments enable row level security;
alter table lesson_progress enable row level security;

-- Profiles: o'zini ko'radi/tahrirlaydi
create policy "profiles self" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Kontent (courses/modules/lessons/pricing): hamma o'qiy oladi (publik katalog)
create policy "courses read" on courses for select using (true);
create policy "pricing read" on pricing_options for select using (true);
create policy "modules read" on modules for select using (true);
-- Darslar metadata'si publik, lekin video_key server (service role) orqali beriladi.
create policy "lessons read" on lessons for select using (true);

-- Enrollments: o'zinikini ko'radi (yozishni service role/webhook bajaradi)
create policy "enroll self read" on enrollments for select using (auth.uid() = user_id);

-- Payments: o'zinikini ko'radi
create policy "payments self read" on payments for select using (auth.uid() = user_id);

-- Progress: o'zinikini boshqaradi
create policy "progress self" on lesson_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Eslatma: enrollments/payments'ga YOZISH faqat service_role (webhook) orqali,
-- shuning uchun bu jadvallarga insert/update policy berilmagan (RLS ularni bloklaydi,
-- service_role esa RLS'ni chetlab o'tadi).
