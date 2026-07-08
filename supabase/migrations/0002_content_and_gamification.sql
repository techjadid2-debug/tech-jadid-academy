-- ============================================================================
-- Kontent boyitish + gamifikatsiya: savol/mashq (quiz), streak/ball, nishonlar,
-- sertifikat, AI sandbox foydalanish jurnali.
-- ============================================================================

alter table lessons add column if not exists sandbox_enabled boolean not null default false;

-- "2 bo'lib to'lash" tarifi: birinchi to'lovda faqat N-darsgacha ochiladi,
-- ikkinchi to'lovdan keyin unlocked_through = null (cheklovsiz, to'liq kirish).
alter table enrollments add column if not exists unlocked_through int;

-- ---- Savol/mashq (MVP: bitta to'g'ri javobli ko'p tanlovli savol) ----
create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  "order" int not null,
  prompt text not null,
  explanation text,
  points int not null default 10,
  unique (lesson_id, "order")
);

create table quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  "order" int not null,
  text text not null,
  is_correct boolean not null default false,
  unique (question_id, "order")
);

create table quiz_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references quiz_questions(id) on delete cascade,
  selected_option_id uuid references quiz_options(id) on delete set null,
  is_correct boolean not null default false,
  first_correct_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

-- ---- Gamifikatsiya: kunlik faollik jurnali + jamlangan holat ----
create table user_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  points_earned int not null default 0,
  lessons_completed int not null default 0,
  quiz_correct int not null default 0,
  unique (user_id, activity_date)
);

create table user_points (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_points int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_activity_date date
);

-- ---- Nishonlar (statik katalog) ----
create table badges (
  code text primary key,
  title text not null,
  description text not null,
  icon text
);

create table user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_code text not null references badges(code) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_code)
);

-- ---- Sertifikat ----
create table certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  code text unique not null,
  issued_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ---- AI sandbox foydalanish jurnali (narx nazorati + audit) ----
create table ai_sandbox_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete set null,
  input_chars int not null,
  output_chars int not null,
  model text not null,
  created_at timestamptz not null default now()
);

create index idx_ai_sandbox_usage_user_time on ai_sandbox_usage(user_id, created_at);
create index idx_quiz_answers_user on quiz_answers(user_id);
create index idx_user_activity_user on user_activity(user_id, activity_date);

-- ============================================================================
-- RLS
-- ============================================================================
alter table quiz_questions enable row level security;
alter table quiz_options enable row level security;
alter table quiz_answers enable row level security;
alter table user_activity enable row level security;
alter table user_points enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table certificates enable row level security;
alter table ai_sandbox_usage enable row level security;

-- Nishonlar katalogi — hech qanday maxfiy ma'lumot yo'q, ochiq o'qish xavfsiz.
create policy "badges read" on badges for select using (true);

-- Savol/variant: ATAYLAB hech qanday select policy berilmagan (anon/authenticated
-- uchun RLS bloklaydi). is_correct ustuni to'g'ridan-to'g'ri anon kalit orqali
-- o'qilishi mumkin bo'lmasligi kerak (0001 migratsiyadagi video_key ochiqligi
-- bilan bir xil xatoni takrorlamaslik uchun). O'qish faqat service role orqali —
-- server tomonidagi dual-mode kontent funksiyalari va webhook/action'lar.

-- Foydalanuvchi ma'lumotlari — faqat o'zinikini o'qiydi, yozish faqat service role.
create policy "quiz_answers self read" on quiz_answers for select using (auth.uid() = user_id);
create policy "user_activity self read" on user_activity for select using (auth.uid() = user_id);
create policy "user_points self read" on user_points for select using (auth.uid() = user_id);
create policy "user_badges self read" on user_badges for select using (auth.uid() = user_id);
create policy "ai_sandbox_usage self read" on ai_sandbox_usage for select using (auth.uid() = user_id);

-- Sertifikat — ATAYLAB ochiq (tekshiruv havolasi tashqi odamlar uchun ham ishlashi kerak).
create policy "certificates public read" on certificates for select using (true);
