-- Admin tomonidan yaratiladigan login + parol hisoblari.
-- Auth email maydoni ichki texnik identifikator bo'lib qoladi; foydalanuvchi
-- faqat profiles.login qiymati bilan tizimga kiradi.

alter table profiles add column if not exists login text;

create unique index if not exists profiles_login_unique
  on profiles ((lower(login)))
  where login is not null;

alter table profiles add constraint profiles_login_format
  check (login is null or login ~ '^[a-z0-9][a-z0-9_.-]{2,31}$') not valid;

comment on column profiles.login is
  'Admin belgilaydigan noyob kurs login nomi. Parol Supabase Auth ichida saqlanadi.';
