-- Jonli guruhlar, jadval, ustoz-o'quvchi oqimi va to'lovdan keyingi aktivatsiya.

alter table enrollment_requests
  drop constraint if exists enrollment_requests_status_check;
alter table enrollment_requests
  add constraint enrollment_requests_status_check
  check (status in ('pending', 'contacted', 'payment_pending', 'approved', 'rejected'));

alter table enrollment_requests
  add column if not exists contacted_at timestamptz,
  add column if not exists selected_kind pay_kind,
  add column if not exists cohort_id uuid;

create table if not exists cohorts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Asia/Tashkent',
  status text not null default 'draft' check (status in ('draft', 'open', 'active', 'completed')),
  telegram_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

alter table enrollment_requests
  drop constraint if exists enrollment_requests_cohort_id_fkey;
alter table enrollment_requests
  add constraint enrollment_requests_cohort_id_fkey
  foreign key (cohort_id) references cohorts(id) on delete set null;

create table if not exists cohort_members (
  cohort_id uuid not null references cohorts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null default 'student' check (member_role in ('student', 'instructor')),
  status text not null default 'invited' check (status in ('invited', 'active', 'completed', 'removed')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (cohort_id, user_id)
);

create table if not exists cohort_lessons (
  cohort_id uuid not null references cohorts(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  release_at timestamptz not null,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cohort_id, lesson_id),
  check (due_at is null or due_at >= release_at)
);

create table if not exists live_sessions (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references cohorts(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  meet_url text,
  youtube_id text,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'completed', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cohort_id, lesson_id),
  check (ends_at > starts_at)
);

create table if not exists attendance (
  session_id uuid not null references live_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('present', 'late', 'absent', 'excused')),
  marked_by uuid references auth.users(id) on delete set null,
  marked_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references cohorts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table payments
  add column if not exists enrollment_request_id uuid references enrollment_requests(id) on delete set null,
  add column if not exists cohort_id uuid references cohorts(id) on delete set null;

create unique index if not exists payments_one_pending_request_step
  on payments(enrollment_request_id, kind, step)
  where status = 'pending' and enrollment_request_id is not null;
create index if not exists idx_cohort_members_user on cohort_members(user_id, status);
create index if not exists idx_cohort_lessons_release on cohort_lessons(cohort_id, release_at);
create index if not exists idx_live_sessions_start on live_sessions(cohort_id, starts_at);
create index if not exists idx_announcements_cohort on announcements(cohort_id, published_at desc);

alter table cohorts enable row level security;
alter table cohort_members enable row level security;
alter table cohort_lessons enable row level security;
alter table live_sessions enable row level security;
alter table attendance enable row level security;
alter table announcements enable row level security;

drop policy if exists "cohorts member read" on cohorts;
create policy "cohorts member read" on cohorts for select using (
  exists (select 1 from cohort_members cm where cm.cohort_id = id and cm.user_id = auth.uid() and cm.status <> 'removed')
);
drop policy if exists "cohort members self read" on cohort_members;
create policy "cohort members self read" on cohort_members for select using (user_id = auth.uid());
drop policy if exists "cohort lessons member read" on cohort_lessons;
create policy "cohort lessons member read" on cohort_lessons for select using (
  exists (select 1 from cohort_members cm where cm.cohort_id = cohort_lessons.cohort_id and cm.user_id = auth.uid() and cm.status <> 'removed')
);
drop policy if exists "live sessions member read" on live_sessions;
create policy "live sessions member read" on live_sessions for select using (
  exists (select 1 from cohort_members cm where cm.cohort_id = live_sessions.cohort_id and cm.user_id = auth.uid() and cm.status <> 'removed')
);
drop policy if exists "attendance self read" on attendance;
create policy "attendance self read" on attendance for select using (user_id = auth.uid());
drop policy if exists "announcements member read" on announcements;
create policy "announcements member read" on announcements for select using (
  exists (select 1 from cohort_members cm where cm.cohort_id = announcements.cohort_id and cm.user_id = auth.uid() and cm.status <> 'removed')
);

revoke insert, update, delete on cohorts, cohort_members, cohort_lessons, live_sessions, attendance, announcements
  from anon, authenticated;

-- Payment finalize RPC bir transaction ichida ishlaydi. Shu trigger payment paid
-- bo'lganda ariza va cohort a'zoligini ham o'sha transactionda faollashtiradi.
create or replace function public.activate_paid_enrollment_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'paid'::pay_status or new.enrollment_request_id is null then
    return new;
  end if;

  update enrollment_requests
     set status = 'approved',
         decided_at = coalesce(decided_at, now()),
         cohort_id = coalesce(cohort_id, new.cohort_id),
         selected_kind = coalesce(selected_kind, new.kind)
   where id = new.enrollment_request_id;

  if new.cohort_id is not null then
    insert into cohort_members (cohort_id, user_id, member_role, status, joined_at)
    values (new.cohort_id, new.user_id, 'student', 'active', now())
    on conflict (cohort_id, user_id) do update set
      member_role = 'student', status = 'active', joined_at = coalesce(cohort_members.joined_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists payments_activate_enrollment_request on payments;
create trigger payments_activate_enrollment_request
after insert or update of status on payments
for each row execute function public.activate_paid_enrollment_request();

revoke all on function public.activate_paid_enrollment_request() from public, anon, authenticated;
