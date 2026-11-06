-- Public lead capture va call-center CRM.
-- Public client jadvallarga bevosita yozmaydi: barcha yozuvlar server action
-- ichidagi service-role klient yoki quyidagi yopiq RPC'lar orqali bajariladi.

create table if not exists sales_leads (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete restrict,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (phone ~ '^\+998[0-9]{9}$'),
  secondary_phone text check (
    secondary_phone is null or secondary_phone ~ '^\+998[0-9]{9}$'
  ),
  age smallint check (age is null or age between 12 and 100),
  extra_info text check (extra_info is null or char_length(extra_info) <= 2000),
  status text not null default 'new' check (
    status in ('new', 'contacted', 'follow_up', 'payment_pending', 'paid', 'lost')
  ),
  assigned_to uuid references profiles(id) on delete set null,
  customer_user_id uuid references profiles(id) on delete set null,
  payment_id uuid references payments(id) on delete set null,
  pricing_kind pay_kind,
  amount_uzs integer check (amount_uzs is null or amount_uzs > 0),
  first_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  last_submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resubmission_count integer not null default 0 check (resubmission_count >= 0),
  unique (course_id, phone)
);

create table if not exists sales_lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references sales_leads(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  activity_type text not null check (
    activity_type in (
      'created',
      'resubmitted',
      'resubmitted_paid',
      'claimed',
      'reassigned',
      'updated',
      'status_changed',
      'note',
      'payment_completed',
      'account_opened'
    )
  ),
  body text check (body is null or char_length(body) <= 4000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_leads_status_created
  on sales_leads(status, last_submitted_at desc);
create index if not exists idx_sales_leads_assignee
  on sales_leads(assigned_to, status, updated_at desc);
create index if not exists idx_sales_leads_follow_up
  on sales_leads(next_follow_up_at)
  where status = 'follow_up';
create index if not exists idx_sales_lead_activities_lead
  on sales_lead_activities(lead_id, created_at desc);

alter table sales_leads enable row level security;
alter table sales_lead_activities enable row level security;
revoke all on sales_leads, sales_lead_activities from anon, authenticated;

create or replace function public.submit_sales_lead(
  p_course_id uuid,
  p_full_name text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead sales_leads%rowtype;
  v_activity text;
begin
  if p_course_id is null
     or char_length(trim(p_full_name)) not between 2 and 120
     or p_phone !~ '^\+998[0-9]{9}$' then
    raise exception 'invalid sales lead';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_course_id::text || ':' || p_phone, 9117)
  );

  select *
    into v_lead
    from sales_leads
   where course_id = p_course_id and phone = p_phone
   for update;

  if found then
    if v_lead.status <> 'paid' then
      update sales_leads
         set full_name = trim(p_full_name),
             status = 'new',
             assigned_to = case
               when v_lead.status = 'lost' then null
               else v_lead.assigned_to
             end,
             next_follow_up_at = null,
             last_submitted_at = now(),
             updated_at = now(),
             resubmission_count = resubmission_count + 1
       where id = v_lead.id
       returning * into v_lead;
      v_activity := 'resubmitted';
    else
      v_activity := 'resubmitted_paid';
    end if;
  else
    insert into sales_leads (course_id, full_name, phone)
    values (p_course_id, trim(p_full_name), p_phone)
    returning * into v_lead;
    v_activity := 'created';
  end if;

  insert into sales_lead_activities (lead_id, activity_type, metadata)
  values (
    v_lead.id,
    v_activity,
    jsonb_build_object('source', 'homepage')
  );

  return v_lead.id;
end;
$$;

revoke all on function public.submit_sales_lead(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.submit_sales_lead(uuid, text, text)
  to service_role;

-- Payment, enrollment va CRM holatini bitta transactionda yakunlaydi.
create or replace function public.complete_sales_lead(
  p_lead_id uuid,
  p_user_id uuid,
  p_amount_uzs integer,
  p_kind pay_kind,
  p_actor_id uuid,
  p_raw jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead sales_leads%rowtype;
  v_actor_role user_role;
  v_payment_id uuid;
begin
  if p_amount_uzs <= 0 or p_kind not in ('lifetime'::pay_kind, 'monthly'::pay_kind) then
    raise exception 'invalid sale payment';
  end if;

  select role into v_actor_role from profiles where id = p_actor_id;
  select * into v_lead from sales_leads where id = p_lead_id for update;

  if v_lead.id is null then
    raise exception 'lead not found';
  end if;
  if v_actor_role <> 'admin'::user_role
     and (v_actor_role <> 'seller'::user_role or v_lead.assigned_to is distinct from p_actor_id) then
    raise exception 'lead forbidden';
  end if;
  if v_lead.status = 'paid' then
    if v_lead.customer_user_id = p_user_id and v_lead.payment_id is not null then
      return v_lead.payment_id;
    end if;
    raise exception 'lead already paid';
  end if;

  insert into payments (
    user_id, course_id, amount_uzs, provider, kind, step, status, paid_at, raw
  )
  values (
    p_user_id,
    v_lead.course_id,
    p_amount_uzs,
    'manual',
    p_kind,
    1,
    'paid',
    now(),
    coalesce(p_raw, '{}'::jsonb) || jsonb_build_object('sales_lead_id', p_lead_id)
  )
  returning id into v_payment_id;

  if p_kind = 'monthly'::pay_kind then
    insert into enrollments (
      user_id, course_id, source, expires_at, unlocked_through, granted_by
    )
    values (
      p_user_id, v_lead.course_id, 'monthly', now() + interval '30 days', null, p_actor_id
    )
    on conflict (user_id, course_id) do update set
      source = 'monthly',
      expires_at = greatest(coalesce(enrollments.expires_at, now()), now()) + interval '30 days',
      unlocked_through = null,
      granted_by = p_actor_id;
  else
    insert into enrollments (
      user_id, course_id, source, expires_at, unlocked_through, granted_by
    )
    values (
      p_user_id, v_lead.course_id, 'lifetime', null, null, p_actor_id
    )
    on conflict (user_id, course_id) do update set
      source = 'lifetime',
      expires_at = null,
      unlocked_through = null,
      granted_by = p_actor_id;
  end if;

  update sales_leads
     set status = 'paid',
         assigned_to = coalesce(assigned_to, p_actor_id),
         customer_user_id = p_user_id,
         payment_id = v_payment_id,
         pricing_kind = p_kind,
         amount_uzs = p_amount_uzs,
         paid_at = now(),
         next_follow_up_at = null,
         updated_at = now()
   where id = p_lead_id;

  insert into sales_lead_activities (
    lead_id, actor_id, activity_type, body, metadata
  )
  values (
    p_lead_id,
    p_actor_id,
    'payment_completed',
    'To''lov tasdiqlandi va kurs ochildi.',
    jsonb_build_object(
      'payment_id', v_payment_id,
      'amount_uzs', p_amount_uzs,
      'kind', p_kind
    )
  );

  insert into sales_lead_activities (
    lead_id, actor_id, activity_type, body, metadata
  )
  values (
    p_lead_id,
    p_actor_id,
    'account_opened',
    'O''quvchi hisobi kursga bog''landi.',
    jsonb_build_object('user_id', p_user_id)
  );

  return v_payment_id;
end;
$$;

revoke all on function public.complete_sales_lead(
  uuid, uuid, integer, pay_kind, uuid, jsonb
) from public, anon, authenticated;
grant execute on function public.complete_sales_lead(
  uuid, uuid, integer, pay_kind, uuid, jsonb
) to service_role;
