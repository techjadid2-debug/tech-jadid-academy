-- 10 savolli testlar, 3 urinish va ustoz ruxsati uchun natijalar.
create table if not exists lesson_assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  attempt_no smallint not null check (attempt_no between 1 and 4),
  score smallint not null check (score between 0 and 10),
  passed boolean not null default false,
  is_override boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id, attempt_no)
);

create index if not exists idx_lesson_assessment_attempts_user_lesson
  on lesson_assessment_attempts(user_id, lesson_id);

alter table lesson_assessment_attempts enable row level security;
create policy "assessment attempts self read" on lesson_assessment_attempts
  for select using (auth.uid() = user_id);
