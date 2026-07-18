-- ============================================================================
-- Uy vazifalari — matn + fayl + havola. O'quvchi topshiradi, AI darhol
-- dastlabki baho beradi, ustoz keyin ko'rib chiqib bahoni tahrirlaydi.
--
-- Bitta o'quvchi + dars uchun bitta yozuv (qayta topshirish mavjudini
-- almashtiradi). Yozish faqat service-role orqali (server action + AI baholash).
-- ============================================================================

create table if not exists homework_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  content_text text,
  link_url text,
  file_path text,
  file_name text,
  status text not null default 'submitted' check (status in ('submitted', 'ai_graded', 'reviewed')),
  ai_score smallint check (ai_score between 0 and 100),
  ai_feedback text,
  ai_model text,
  teacher_score smallint check (teacher_score between 0 and 100),
  teacher_feedback text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists idx_homework_submissions_status
  on homework_submissions(status, created_at);

alter table homework_submissions enable row level security;

create policy "homework submissions self read" on homework_submissions
  for select using (auth.uid() = user_id);

-- ---- Storage: uy vazifasi fayllari (private, faqat service-role o'qiydi/yozadi) ----
insert into storage.buckets (id, name, public)
values ('homework', 'homework', false)
on conflict (id) do nothing;
