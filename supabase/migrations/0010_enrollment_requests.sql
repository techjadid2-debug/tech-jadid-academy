-- ============================================================================
-- Ro'yxatdan o'tish arizalari — ochiq registratsiya, ustoz tasdig'igacha kirish
-- yo'q. Har yozuv bitta (user, course) juftligi uchun so'rov holatini saqlaydi.
--
-- Yozish (insert/update) faqat service-role orqali (register/admin server
-- action'lari); o'quvchi faqat o'z arizasini o'qiy oladi.
-- ============================================================================

create table if not exists enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  contact text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null
);

-- Bitta faol (pending) ariza — takroriy so'rovni oldini oladi.
create unique index if not exists enrollment_requests_pending_unique
  on enrollment_requests(user_id, course_id)
  where status = 'pending';

create index if not exists idx_enrollment_requests_status
  on enrollment_requests(status, created_at);

alter table enrollment_requests enable row level security;

create policy "enrollment requests self read" on enrollment_requests
  for select using (auth.uid() = user_id);
