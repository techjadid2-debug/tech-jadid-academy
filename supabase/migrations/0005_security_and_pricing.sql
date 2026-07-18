-- RLS hardening va mavjud bazalardagi pricing drift'ni tuzatish.

-- Foydalanuvchi o'z profilining role ustunini o'zgartira olmasin.
drop policy if exists "profiles self" on profiles;
drop policy if exists "profiles self read" on profiles;
drop policy if exists "profiles self insert" on profiles;
drop policy if exists "profiles self update" on profiles;

create policy "profiles self read" on profiles
  for select using (auth.uid() = id);
create policy "profiles self insert" on profiles
  for insert with check (auth.uid() = id and role = 'student'::user_role);
create policy "profiles self update" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

revoke insert, update, delete on profiles from anon, authenticated;
grant insert (id, full_name, phone, telegram_id, avatar_url)
  on profiles to authenticated;
grant update (full_name, phone, telegram_id, avatar_url)
  on profiles to authenticated;

-- Progress faqat server action/service-role orqali yoziladi; client REST faqat o'qiydi.
drop policy if exists "progress self" on lesson_progress;
create policy "progress self read" on lesson_progress
  for select using (auth.uid() = user_id);
revoke insert, update, delete on lesson_progress from anon, authenticated;

-- Video key anon javobida chiqmasin. Server service-role orqali to'liq kontentni oladi.
revoke select on lessons from anon, authenticated;
grant select (id, module_id, "order", title, type, youtube_id, duration_sec,
  is_preview, rows, sandbox_enabled) on lessons to anon, authenticated;

-- Draft kurslar katalogda ko'rinmasin.
drop policy if exists "courses read" on courses;
create policy "published courses read" on courses
  for select using (is_published = true);

-- Sertifikat tekshiruvi server route orqali bo'ladi; barcha jadvalni anon'ga bermaymiz.
drop policy if exists "certificates public read" on certificates;
revoke select on certificates from anon, authenticated;

-- Yangi narx modeli mavjud installation'larda ham bir xil bo'lsin.
delete from pricing_options p
using courses c
where p.course_id = c.id and c.slug = 'ai-asoslari' and p.kind = 'monthly';

update pricing_options p
set label = 'Bir martalik to''lov',
    price_uzs = 350000,
    note = 'Bitta to''lov — darhol barcha 16 darsga umrbod kirish.'
from courses c
where p.course_id = c.id and c.slug = 'ai-asoslari' and p.kind = 'lifetime';

insert into pricing_options (course_id, kind, label, price_uzs, note)
select c.id, 'installment2'::pay_kind, '2 bo''lib to''lash', 225000,
  'Hozir 225 000 so''m (1–8-darslar ochiladi), keyin yana 225 000 so''m (jami 450 000) — qolgan darslar ochiladi.'
from courses c
where c.slug = 'ai-asoslari'
on conflict (course_id, kind) do update set
  label = excluded.label,
  price_uzs = excluded.price_uzs,
  note = excluded.note;

-- Immutable first completion marker prevents unmark/complete point farming.
alter table lesson_progress add column if not exists first_completed_at timestamptz;
update lesson_progress
set first_completed_at = coalesce(first_completed_at, updated_at, now())
where completed = true and first_completed_at is null;

create or replace function public.set_lesson_progress_claim(
  p_user_id uuid,
  p_lesson_id uuid,
  p_completed boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_can_claim boolean;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_lesson_id::text, 9101));

  select (first_completed_at is null)
    into v_can_claim
    from lesson_progress
   where user_id = p_user_id and lesson_id = p_lesson_id
   for update;

  if not found then
    insert into lesson_progress (user_id, lesson_id, completed, first_completed_at, updated_at)
    values (p_user_id, p_lesson_id, p_completed,
      case when p_completed then now() else null end, now());
    return p_completed;
  end if;

  update lesson_progress
     set completed = p_completed,
         first_completed_at = case
           when p_completed then coalesce(first_completed_at, now())
           else first_completed_at
         end,
         updated_at = now()
   where user_id = p_user_id and lesson_id = p_lesson_id;

  return p_completed and coalesce(v_can_claim, false);
end;
$$;

create or replace function public.submit_quiz_answer_claim(
  p_user_id uuid,
  p_question_id uuid,
  p_option_id uuid,
  p_is_correct boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_first_correct_at timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_question_id::text, 9102));

  select first_correct_at
    into v_first_correct_at
    from quiz_answers
   where user_id = p_user_id and question_id = p_question_id
   for update;

  if found then
    if v_first_correct_at is not null then return false; end if;
    update quiz_answers
       set selected_option_id = p_option_id,
           is_correct = p_is_correct,
           first_correct_at = case when p_is_correct then now() else null end,
           updated_at = now()
     where user_id = p_user_id and question_id = p_question_id;
    return p_is_correct;
  end if;

  insert into quiz_answers (user_id, question_id, selected_option_id, is_correct, first_correct_at, updated_at)
  values (p_user_id, p_question_id, p_option_id, p_is_correct,
    case when p_is_correct then now() else null end, now());
  return p_is_correct;
end;
$$;

create or replace function public.record_gamification_activity(
  p_user_id uuid,
  p_lessons_completed integer,
  p_quiz_correct integer,
  p_points integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Tashkent')::date;
  v_yesterday date := ((now() at time zone 'Asia/Tashkent')::date - 1);
  v_last date;
  v_current integer;
  v_longest integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 9103));

  insert into user_activity (user_id, activity_date, points_earned, lessons_completed, quiz_correct)
  values (p_user_id, v_today, greatest(p_points, 0), greatest(p_lessons_completed, 0), greatest(p_quiz_correct, 0))
  on conflict (user_id, activity_date) do update set
    points_earned = user_activity.points_earned + excluded.points_earned,
    lessons_completed = user_activity.lessons_completed + excluded.lessons_completed,
    quiz_correct = user_activity.quiz_correct + excluded.quiz_correct;

  select current_streak, longest_streak, last_activity_date
    into v_current, v_longest, v_last
    from user_points
   where user_id = p_user_id
   for update;

  if not found then
    v_current := 1;
    v_longest := 1;
    insert into user_points (user_id, total_points, current_streak, longest_streak, last_activity_date)
    values (p_user_id, greatest(p_points, 0), v_current, v_longest, v_today);
  else
    v_current := case
      when v_last = v_today then v_current
      when v_last = v_yesterday then v_current + 1
      else 1
    end;
    v_longest := greatest(coalesce(v_longest, 0), v_current);
    update user_points
       set total_points = total_points + greatest(p_points, 0),
           current_streak = v_current,
           longest_streak = v_longest,
           last_activity_date = v_today
     where user_id = p_user_id;
  end if;

  if v_current >= 3 then
    insert into user_badges (user_id, badge_code) values (p_user_id, 'streak-3') on conflict do nothing;
  end if;
  if v_current >= 7 then
    insert into user_badges (user_id, badge_code) values (p_user_id, 'streak-7') on conflict do nothing;
  end if;
  if p_quiz_correct > 0 and (select coalesce(sum(quiz_correct), 0) from user_activity where user_id = p_user_id) >= 20 then
    insert into user_badges (user_id, badge_code) values (p_user_id, 'quiz-20') on conflict do nothing;
  end if;
end;
$$;

create or replace function public.claim_ai_sandbox_usage(
  p_user_id uuid,
  p_lesson_id uuid,
  p_input_chars integer,
  p_model text,
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
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 9104));
  if (select count(*) from ai_sandbox_usage
       where user_id = p_user_id and created_at >= now() - interval '24 hours') >= p_daily_limit then
    return null;
  end if;

  insert into ai_sandbox_usage (user_id, lesson_id, input_chars, output_chars, model)
  values (p_user_id, p_lesson_id, p_input_chars, 0, p_model)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.set_lesson_progress_claim(uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function public.submit_quiz_answer_claim(uuid, uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function public.record_gamification_activity(uuid, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.claim_ai_sandbox_usage(uuid, uuid, integer, text, integer) from public, anon, authenticated;
grant execute on function public.set_lesson_progress_claim(uuid, uuid, boolean) to service_role;
grant execute on function public.submit_quiz_answer_claim(uuid, uuid, uuid, boolean) to service_role;
grant execute on function public.record_gamification_activity(uuid, integer, integer, integer) to service_role;
grant execute on function public.claim_ai_sandbox_usage(uuid, uuid, integer, text, integer) to service_role;

-- Payment entitlement'ni qolgan paid payment'lardan deterministik qayta hisoblaydi.
create or replace function public.reconcile_payment_entitlement(
  p_user_id uuid,
  p_course_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source enroll_source;
  v_lifetime boolean;
  v_step1 bigint;
  v_step2 bigint;
  v_monthly_until timestamptz;
begin
  select source into v_source
    from enrollments
   where user_id = p_user_id and course_id = p_course_id
   for update;
  if v_source = 'admin'::enroll_source then return; end if;

  select coalesce(bool_or(kind = 'lifetime'::pay_kind), false),
         count(*) filter (where kind = 'installment2'::pay_kind and step = 1),
         count(*) filter (where kind = 'installment2'::pay_kind and step = 2),
         max(coalesce(paid_at, created_at) + interval '30 days') filter (where kind = 'monthly'::pay_kind)
    into v_lifetime, v_step1, v_step2, v_monthly_until
    from payments
   where user_id = p_user_id and course_id = p_course_id and status = 'paid'::pay_status;

  if v_lifetime or (v_step1 > 0 and v_step2 > 0) then
    insert into enrollments (user_id, course_id, source, expires_at, unlocked_through)
    values (p_user_id, p_course_id,
      case when v_lifetime then 'lifetime'::enroll_source else 'installment2'::enroll_source end,
      null, null)
    on conflict (user_id, course_id) do update set
      source = excluded.source, expires_at = null, unlocked_through = null;
  elsif v_step1 > 0 or v_step2 > 0 then
    insert into enrollments (user_id, course_id, source, expires_at, unlocked_through)
    values (p_user_id, p_course_id, 'installment2'::enroll_source, null, 8)
    on conflict (user_id, course_id) do update set
      source = excluded.source, expires_at = null, unlocked_through = 8;
  elsif v_monthly_until is not null then
    insert into enrollments (user_id, course_id, source, expires_at, unlocked_through)
    values (p_user_id, p_course_id, 'monthly'::enroll_source, v_monthly_until, null)
    on conflict (user_id, course_id) do update set
      source = excluded.source, expires_at = excluded.expires_at, unlocked_through = null;
  else
    delete from enrollments where user_id = p_user_id and course_id = p_course_id;
  end if;
end;
$$;

create or replace function public.finalize_payment_once(
  p_payment_id uuid,
  p_provider_txn_id text,
  p_raw jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment payments%rowtype;
  v_partial boolean;
begin
  select * into v_payment from payments where id = p_payment_id for update;
  if not found then raise exception 'payment_not_found'; end if;
  if v_payment.status = 'paid'::pay_status then return false; end if;
  if v_payment.status <> 'pending'::pay_status then raise exception 'payment_not_pending'; end if;
  if v_payment.course_id is null then raise exception 'payment_course_missing'; end if;
  if v_payment.provider_txn_id is not null and p_provider_txn_id is not null
     and v_payment.provider_txn_id <> p_provider_txn_id then
    raise exception 'payment_transaction_mismatch';
  end if;

  if v_payment.kind = 'installment2'::pay_kind and v_payment.step = 2 then
    select exists(
      select 1 from enrollments
       where user_id = v_payment.user_id and course_id = v_payment.course_id
         and source = 'installment2'::enroll_source and unlocked_through is not null
    ) into v_partial;
    if not v_partial then raise exception 'installment_first_payment_missing'; end if;
  end if;

  update payments
     set status = 'paid'::pay_status,
         paid_at = now(),
         provider_txn_id = coalesce(p_provider_txn_id, provider_txn_id),
         raw = coalesce(p_raw, raw)
   where id = p_payment_id and status = 'pending'::pay_status;

  perform reconcile_payment_entitlement(v_payment.user_id, v_payment.course_id);
  return true;
end;
$$;

create or replace function public.cancel_payment_and_reconcile(
  p_payment_id uuid,
  p_raw jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment payments%rowtype;
  v_was_paid boolean;
begin
  select * into v_payment from payments where id = p_payment_id for update;
  if not found then raise exception 'payment_not_found'; end if;
  if v_payment.status = 'canceled'::pay_status then return false; end if;
  v_was_paid := v_payment.status = 'paid'::pay_status;

  update payments
     set status = 'canceled'::pay_status,
         raw = coalesce(p_raw, raw)
   where id = p_payment_id;

  if v_was_paid and v_payment.course_id is not null then
    perform reconcile_payment_entitlement(v_payment.user_id, v_payment.course_id);
  end if;
  return v_was_paid;
end;
$$;

create or replace function public.bind_payment_transaction(
  p_payment_id uuid,
  p_provider_txn_id text,
  p_raw jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing text;
  v_status pay_status;
begin
  select provider_txn_id, status into v_existing, v_status
    from payments where id = p_payment_id for update;
  if not found or v_status <> 'pending'::pay_status then return false; end if;
  if v_existing is not null and v_existing <> p_provider_txn_id then return false; end if;
  update payments
     set provider_txn_id = p_provider_txn_id,
         raw = coalesce(p_raw, raw)
   where id = p_payment_id;
  return true;
end;
$$;

revoke all on function public.reconcile_payment_entitlement(uuid, uuid) from public, anon, authenticated;
revoke all on function public.finalize_payment_once(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.cancel_payment_and_reconcile(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.bind_payment_transaction(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.finalize_payment_once(uuid, text, jsonb) to service_role;
grant execute on function public.cancel_payment_and_reconcile(uuid, jsonb) to service_role;
grant execute on function public.bind_payment_transaction(uuid, text, jsonb) to service_role;

-- Global lesson order (slug + order) lookup'ini race-safe himoyalash.
create or replace function public.enforce_course_lesson_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
begin
  select course_id into v_course_id from modules where id = new.module_id;
  perform pg_advisory_xact_lock(hashtextextended(v_course_id::text || ':' || new."order"::text, 9105));
  if exists (
    select 1
      from lessons l
      join modules m on m.id = l.module_id
     where m.course_id = v_course_id
       and l."order" = new."order"
       and l.id <> new.id
  ) then
    raise exception 'lesson_order_already_exists' using errcode = '23505';
  end if;
  return new;
end;
$$;

drop trigger if exists lessons_course_order_guard on lessons;
create trigger lessons_course_order_guard
before insert or update of module_id, "order" on lessons
for each row execute function public.enforce_course_lesson_order();

-- Admin quiz edit: savol va variantlarni bitta transaction ichida almashtiradi.
create or replace function public.replace_quiz_question(
  p_question_id uuid,
  p_lesson_id uuid,
  p_prompt text,
  p_explanation text,
  p_points integer,
  p_options jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_question_id uuid := p_question_id;
  v_order integer;
begin
  if jsonb_array_length(p_options) < 2
     or (select count(*) from jsonb_array_elements(p_options) o where (o->>'is_correct')::boolean) <> 1 then
    raise exception 'quiz_options_invalid';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_lesson_id::text, 9106));
  if v_question_id is null then
    select coalesce(max("order"), 0) + 1 into v_order
      from quiz_questions where lesson_id = p_lesson_id;
    insert into quiz_questions (lesson_id, "order", prompt, explanation, points)
    values (p_lesson_id, v_order, p_prompt, p_explanation, greatest(p_points, 1))
    returning id into v_question_id;
  else
    if not exists (select 1 from quiz_questions where id = v_question_id and lesson_id = p_lesson_id) then
      raise exception 'quiz_question_not_found';
    end if;
    update quiz_questions
       set prompt = p_prompt, explanation = p_explanation, points = greatest(p_points, 1)
     where id = v_question_id;
    delete from quiz_options where question_id = v_question_id;
  end if;

  insert into quiz_options (question_id, "order", text, is_correct)
  select v_question_id,
         (o->>'order')::integer,
         o->>'text',
         (o->>'is_correct')::boolean
    from jsonb_array_elements(p_options) o;
  return v_question_id;
end;
$$;

revoke all on function public.replace_quiz_question(uuid, uuid, text, text, integer, jsonb) from public, anon, authenticated;
grant execute on function public.replace_quiz_question(uuid, uuid, text, text, integer, jsonb) to service_role;
