-- Bepul manual to'lov oqimi: Telegram bot orqali chek yuborish va admin tasdig'i.
-- Real Payme/Click/Uzum keyinroq ulanadi; bu provider server-side approval talab qiladi.

alter type pay_provider add value if not exists 'manual';

alter table profiles
  add column if not exists telegram_chat_id bigint;

alter table payments
  add column if not exists telegram_chat_id bigint;

create index if not exists idx_payments_manual_chat
  on payments(provider, telegram_chat_id, status, created_at desc);

-- Bitta foydalanuvchi/kurs uchun bir nechta ochiq manual buyurtma bo'lmasin.
create unique index if not exists idx_one_pending_manual_payment
  on payments(user_id, course_id, provider)
  where status = 'pending' and provider = 'manual';

-- Manual receipt metadata'si service-role orqali payments.raw ichida saqlanadi.
comment on column payments.telegram_chat_id is
  'Manual Telegram payment oqimida foydalanuvchining chat IDsi.';
