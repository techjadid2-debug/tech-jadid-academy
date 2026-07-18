-- ============================================================================
-- "2 bo'lib to'lash" uchun enum qiymatlari, to'lov jadvali kengaytmalari va
-- nishonlar (badges) katalogi seed'i.
--
-- MUHIM: 0001'dagi pay_kind/enroll_source enum'larida 'installment2' yo'q edi —
-- kod (types.ts, access.ts) esa uni allaqachon ishlatadi. Bu migratsiya shu
-- nomuvofiqlikni tuzatadi.
-- ============================================================================

alter type pay_kind add value if not exists 'installment2';
alter type enroll_source add value if not exists 'installment2';

-- "2 bo'lib to'lash"ning qaysi bosqichi (1 yoki 2); boshqa tariflar uchun 1.
alter table payments add column if not exists step smallint not null default 1;
alter table payments add column if not exists paid_at timestamptz;

create index if not exists idx_payments_status on payments(status, created_at);

-- ---- Nishonlar katalogi (0002'dagi badges jadvali uchun boshlang'ich to'plam) ----
insert into badges (code, title, description, icon) values
  ('first-lesson', 'Ilk qadam',        'Birinchi darsni yakunladingiz.', '🚀'),
  ('streak-3',     '3 kunlik seriya',  'Ketma-ket 3 kun shug''ullandingiz.', '🔥'),
  ('streak-7',     '7 kunlik seriya',  'Ketma-ket 7 kun shug''ullandingiz.', '⚡'),
  ('quiz-20',      'Bilimdon',         '20 ta savolga to''g''ri javob berdingiz.', '🧠'),
  ('module-1',     'Poydevor qo''yildi', 'Birinchi modulni to''liq yakunladingiz.', '🏗️'),
  ('course-100',   'Bitiruvchi',       'Kursni 100% yakunladingiz.', '🎓')
on conflict (code) do nothing;
