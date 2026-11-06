-- Seller audit izi, atomik manual to'lov, homework AI quota va Storage limitlari.

alter table profiles
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table enrollments
  add column if not exists granted_by uuid references auth.users(id) on delete set null;

create index if not exists idx_profiles_created_by on profiles(created_by);
create index if not exists idx_enrollments_granted_by on enrollments(granted_by);

-- Signed upload URL'dagi client metadata'ga ishonmaymiz: bucketning o'zi ham
-- hajm va MIME turini cheklaydi.
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ]::text[]
where id = 'homework';

create table if not exists homework_ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_homework_ai_usage_limit
  on homework_ai_usage(user_id, created_at desc);

alter table homework_ai_usage enable row level security;
revoke all on homework_ai_usage from anon, authenticated;

create or replace function public.claim_homework_ai_usage(
  p_user_id uuid,
  p_lesson_id uuid,
  p_daily_limit integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':homework-ai', 9110));
  if (select count(*) from homework_ai_usage
       where user_id = p_user_id and created_at >= now() - interval '24 hours')
       >= greatest(p_daily_limit, 0) then
    return null;
  end if;

  insert into homework_ai_usage (user_id, lesson_id)
  values (p_user_id, p_lesson_id)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.claim_homework_ai_usage(uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.claim_homework_ai_usage(uuid, uuid, integer)
  to service_role;

-- Payment va entitlement bitta transactionda yoziladi. Shunday qilib payment
-- insert xatosi bepul kirish yoki muddat uzayishiga olib kelmaydi.
create or replace function public.record_manual_access_payment(
  p_user_id uuid,
  p_course_id uuid,
  p_amount_uzs integer,
  p_kind pay_kind,
  p_step integer,
  p_actor_id uuid,
  p_raw jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment_id uuid;
  v_updated integer;
begin
  if p_amount_uzs <= 0 or p_step not in (1, 2) then
    raise exception 'invalid manual payment';
  end if;

  insert into payments (
    user_id, course_id, amount_uzs, provider, kind, step, status, paid_at, raw
  )
  values (
    p_user_id, p_course_id, p_amount_uzs, 'manual', p_kind, p_step, 'paid',
    now(), coalesce(p_raw, '{}'::jsonb)
  )
  returning id into v_payment_id;

  if p_kind = 'monthly'::pay_kind then
    insert into enrollments (
      user_id, course_id, source, expires_at, unlocked_through, granted_by
    )
    values (
      p_user_id, p_course_id, 'monthly', now() + interval '30 days', null, p_actor_id
    )
    on conflict (user_id, course_id) do update set
      source = 'monthly',
      expires_at = greatest(coalesce(enrollments.expires_at, now()), now()) + interval '30 days',
      unlocked_through = null,
      granted_by = p_actor_id;
  elsif p_kind = 'installment2'::pay_kind and p_step = 2 then
    update enrollments
       set unlocked_through = null,
           granted_by = p_actor_id
     where user_id = p_user_id and course_id = p_course_id;
    get diagnostics v_updated = row_count;
    if v_updated <> 1 then
      raise exception 'partial enrollment not found';
    end if;
  else
    insert into enrollments (
      user_id, course_id, source, expires_at, unlocked_through, granted_by
    )
    values (
      p_user_id, p_course_id, 'lifetime', null, null, p_actor_id
    )
    on conflict (user_id, course_id) do update set
      source = 'lifetime',
      expires_at = null,
      unlocked_through = null,
      granted_by = p_actor_id;
  end if;

  return v_payment_id;
end;
$$;

revoke all on function public.record_manual_access_payment(
  uuid, uuid, integer, pay_kind, integer, uuid, jsonb
) from public, anon, authenticated;
grant execute on function public.record_manual_access_payment(
  uuid, uuid, integer, pay_kind, integer, uuid, jsonb
) to service_role;
