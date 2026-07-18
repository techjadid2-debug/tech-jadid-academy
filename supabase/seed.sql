-- ============================================================================
-- Seed: "Sun'iy Intellekt Asoslari" kursi (src/lib/course-data.ts bilan mos).
-- Migratsiyadan keyin ishga tushiring.
-- ============================================================================

-- Kurs
insert into courses (slug, title, subtitle, is_published)
values (
  'ai-asoslari',
  'Sun''iy Intellekt Asoslari',
  '16 darslik amaliy kurs. AI''ni tushuna va super darajada ishlata oladigan mutaxassis bo''lasiz.',
  true
)
on conflict (slug) do nothing;

-- Narx variantlari (installment2 uchun avval 0003 migratsiya qo'llangan bo'lishi kerak)
insert into pricing_options (course_id, kind, label, price_uzs, note)
select c.id, v.kind::pay_kind, v.label, v.price_uzs, v.note
from courses c,
  (values
    ('lifetime', 'To''liq kurs uchun bir martalik to''lov', 600000, '2 oylik jonli guruh, 16 darslik platforma va barcha amaliy materiallar.'),
    ('monthly', 'Oyma-oy to''lash', 350000, 'Har oy 350 000 so''m. Kurs 2 oy davom etadi (jami 700 000 so''m).')
  ) as v(kind, label, price_uzs, note)
where c.slug = 'ai-asoslari'
on conflict (course_id, kind) do update set
  label = excluded.label,
  price_uzs = excluded.price_uzs,
  note = excluded.note;

delete from pricing_options p
using courses c
where p.course_id = c.id and c.slug = 'ai-asoslari' and p.kind = 'installment2';

-- Modullar
insert into modules (course_id, "order", code, title, range_text, accent)
select c.id, m."order", m.code, m.title, m.range_text, m.accent
from courses c,
  (values
    (1, 'MODUL 01', 'AI Poydevori', 'Darslar 1–3 · Model qanday ishlaydi va qaysi birini tanlash', 'blue'),
    (2, 'MODUL 02', 'Prompt Engineering', 'Darslar 4–6 · Aniq buyruqdan qayta ishlatiladigan workflow''gacha', 'red'),
    (3, 'MODUL 03', 'Media Generatsiya', 'Darslar 7–9 · Rasmdan to''liq video pipeline''gacha', 'yellow'),
    (4, 'MODUL 04', 'Vibe Coding', 'Darslar 10–12 · Kod yozmasdan real mahsulot qurish', 'green'),
    (5, 'MODUL 05', 'Agentlar & Avtomatlashtirish', 'Darslar 13–14 · AI''ni asboblarga ulash va bot qurish', 'blue'),
    (6, 'MODUL 06', 'Tatbiq & Monetizatsiya', 'Darslar 15–16 · Ko''nikmani real daromadga aylantirish', 'red')
  ) as m("order", code, title, range_text, accent)
where c.slug = 'ai-asoslari'
on conflict (course_id, "order") do nothing;

-- Darslar (module + global order bo'yicha).
-- Batafsil "rows" (Nazariy/Amaliy/Natija) ilovadan (course-data.ts) yuklanadi;
-- bu yerda asosiy metadata seed qilinadi.
insert into lessons (module_id, "order", title, type, video_key, is_preview)
select mod.id, l."order", l.title, 'video'::lesson_type,
       'ai-asoslari/' || lpad(l."order"::text, 2, '0'),
       (l."order" = 1)   -- 1-dars bepul preview
from modules mod
join courses c on c.id = mod.course_id and c.slug = 'ai-asoslari',
  (values
    (1, 1, 'Sun''iy intellekt nima?'),
    (2, 1, 'LLM ichida nima bor?'),
    (3, 1, 'Modellar dunyosi va model tanlash'),
    (4, 2, 'Prompt Engineering asoslari'),
    (5, 2, 'Advanced Prompting'),
    (6, 2, 'Prompt''dan shaxsiy workflow''ga'),
    (7, 3, 'Rasm generatsiyasi asoslari'),
    (8, 3, 'Advanced rasm: izchillik, tahrirlash'),
    (9, 3, 'Video + Ovoz: to''liq pipeline'),
    (10, 4, 'Vibe coding nima? Tool''lar'),
    (11, 4, 'Birinchi haqiqiy app + deploy'),
    (12, 4, 'AI-quvvatli app qurish'),
    (13, 5, 'AI agentlar va MCP'),
    (14, 5, 'Shaxsiy AI yordamchi + Telegram bot'),
    (15, 6, 'AI''ni real kasbga tatbiq etish'),
    (16, 6, 'Capstone: Portfolio + Monetizatsiya')
  ) as l("order", module_order, title)
where mod."order" = l.module_order
on conflict (module_id, "order") do nothing;
