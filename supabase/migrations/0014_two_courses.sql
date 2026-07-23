-- ============================================================================
-- 0014 — Bitta kursdan ikkita kursga o'tish.
-- Eski "ai-asoslari"ni nashrdan chiqaradi (ma'lumot o'chmaydi) va ikkita yangi
-- kurs (AI Video Creator, AI Builder) metadatasini qo'shadi. Idempotent.
-- Boy kontent/viktorinalar keyin seed:content va seed:quizzes bilan to'ldiriladi.
-- ============================================================================

-- Eski kursni nashrdan chiqarish.
update courses set is_published = false where slug = 'ai-asoslari';

-- ---------------------------------------------------------------------------
-- KURS 1 — AI Video Creator
-- ---------------------------------------------------------------------------
insert into courses (slug, title, subtitle, is_published)
values (
  'ai-video-creator',
  'AI Video Creator',
  '16 darslik amaliy kurs. G''oyadan professional AI videogacha: rasm, video, ovoz, musiqa va montaj.',
  true
)
on conflict (slug) do update set title = excluded.title, subtitle = excluded.subtitle, is_published = true;

insert into pricing_options (course_id, kind, label, price_uzs, note)
select c.id, v.kind::pay_kind, v.label, v.price_uzs, v.note
from courses c,
  (values
    ('lifetime', 'To''liq kurs uchun bir martalik to''lov', 600000, '2 oylik jonli guruh, 16 darslik platforma va barcha amaliy materiallar.'),
    ('monthly', 'Oyma-oy to''lash', 350000, 'Har oy 350 000 so''m. Kurs 2 oy davom etadi (jami 700 000 so''m).')
  ) as v(kind, label, price_uzs, note)
where c.slug = 'ai-video-creator'
on conflict (course_id, kind) do update set
  label = excluded.label, price_uzs = excluded.price_uzs, note = excluded.note;

insert into modules (course_id, "order", code, title, range_text, accent)
select c.id, m."order", m.code, m.title, m.range_text, m.accent
from courses c,
  (values
    (1, 'MODUL 01', 'AI Poydevori', 'Darslar 1–3 · Generativ AI, prompt va vosita tanlash', 'blue'),
    (2, 'MODUL 02', 'Vizual Poydevor', 'Darslar 4–5 · AI rasm va izchillik', 'red'),
    (3, 'MODUL 03', 'AI Video Studio', 'Darslar 6–13 · Ssenariydan barqaror video kadrgacha', 'yellow'),
    (4, 'MODUL 04', 'Production va Monetizatsiya', 'Darslar 14–16 · Montaj, format va daromad', 'green')
  ) as m("order", code, title, range_text, accent)
where c.slug = 'ai-video-creator'
on conflict (course_id, "order") do nothing;

insert into lessons (module_id, "order", title, type, video_key, is_preview)
select mod.id, l."order", l.title, 'video'::lesson_type, null, (l."order" = 1)
from modules mod
join courses c on c.id = mod.course_id and c.slug = 'ai-video-creator',
  (values
    (1, 1, 'Generativ AI va zamonaviy modellar'),
    (2, 1, 'Creator Prompt Engineering'),
    (3, 1, 'AI tool va model tanlash'),
    (4, 2, 'AI rasm generatsiyasi'),
    (5, 2, 'Personaj, mahsulot va uslub izchilligi'),
    (6, 3, 'Video g''oya, hook va ssenariy'),
    (7, 3, 'Storyboard va shot list'),
    (8, 3, 'AI video prompt anatomiyasi'),
    (9, 3, 'Text-to-video va image-to-video'),
    (10, 3, 'Kamera harakati va motion control'),
    (11, 3, 'Personaj va mahsulot izchilligi'),
    (12, 3, 'Lip-sync va o''zbekcha ovoz'),
    (13, 3, 'AI musiqa va sound design'),
    (14, 4, 'CapCut''da montaj va post-production'),
    (15, 4, 'Kontent formatlari va monetizatsiya'),
    (16, 4, 'Capstone: professional AI video')
  ) as l("order", module_order, title)
where mod."order" = l.module_order
on conflict (module_id, "order") do nothing;

-- ---------------------------------------------------------------------------
-- KURS 2 — AI Builder
-- ---------------------------------------------------------------------------
insert into courses (slug, title, subtitle, is_published)
values (
  'ai-builder',
  'AI Builder',
  '16 darslik amaliy kurs. G''oya → Website → AI Web App → Telegram bot → AI agentgacha bitta to''liq mahsulot.',
  true
)
on conflict (slug) do update set title = excluded.title, subtitle = excluded.subtitle, is_published = true;

insert into pricing_options (course_id, kind, label, price_uzs, note)
select c.id, v.kind::pay_kind, v.label, v.price_uzs, v.note
from courses c,
  (values
    ('lifetime', 'To''liq kurs uchun bir martalik to''lov', 600000, '2 oylik jonli guruh, 16 darslik platforma va barcha amaliy materiallar.'),
    ('monthly', 'Oyma-oy to''lash', 350000, 'Har oy 350 000 so''m. Kurs 2 oy davom etadi (jami 700 000 so''m).')
  ) as v(kind, label, price_uzs, note)
where c.slug = 'ai-builder'
on conflict (course_id, kind) do update set
  label = excluded.label, price_uzs = excluded.price_uzs, note = excluded.note;

insert into modules (course_id, "order", code, title, range_text, accent)
select c.id, m."order", m.code, m.title, m.range_text, m.accent
from courses c,
  (values
    (1, 'MODUL 01', 'Vibe Coding va mahsulot rejasi', 'Darslar 1–2 · Coding agentlar va texnik reja', 'blue'),
    (2, 'MODUL 02', 'Website yaratish', 'Darslar 3–5 · Landing, frontend, deploy', 'red'),
    (3, 'MODUL 03', 'AI Web App', 'Darslar 6–8 · Backend, LLM API va auth', 'yellow'),
    (4, 'MODUL 04', 'AI Telegram Bot', 'Darslar 9–11 · Multimodal bot va deploy', 'green'),
    (5, 'MODUL 05', 'AI Agentlar', 'Darslar 12–15 · Tool, RAG, xotira va xavfsizlik', 'blue'),
    (6, 'MODUL 06', 'Capstone', 'Dars 16 · Hammasini bitta mahsulotga birlashtirish', 'red')
  ) as m("order", code, title, range_text, accent)
where c.slug = 'ai-builder'
on conflict (course_id, "order") do nothing;

insert into lessons (module_id, "order", title, type, video_key, is_preview)
select mod.id, l."order", l.title, 'video'::lesson_type, null, (l."order" = 1)
from modules mod
join courses c on c.id = mod.course_id and c.slug = 'ai-builder',
  (values
    (1, 1, 'Vibe Coding va coding agentlar'),
    (2, 1, 'Muammo, MVP, PRD va loyiha arxitekturasi'),
    (3, 2, 'Landing page va UI/UX'),
    (4, 2, 'Responsive frontend, forma va interaktivlik'),
    (5, 2, 'Database ulash, deploy va domen'),
    (6, 3, 'Backend va API asoslari'),
    (7, 3, 'LLM API va structured output'),
    (8, 3, 'Authentication, foydalanuvchi ma''lumotlari va AI funksiyasi'),
    (9, 4, 'Telegram bot arxitekturasi va komandalar'),
    (10, 4, 'Matn, rasm va ovozni tushunadigan AI bot'),
    (11, 4, 'Botni database va web-app bilan ulash, deploy qilish'),
    (12, 5, 'Workflow va AI agent farqi'),
    (13, 5, 'Function calling va tashqi tool''lar'),
    (14, 5, 'RAG, xotira va MCP integratsiyasi'),
    (15, 5, 'Human approval, evals, xavfsizlik va monitoring'),
    (16, 6, 'Website + Telegram bot + AI agentni birlashtirish')
  ) as l("order", module_order, title)
where mod."order" = l.module_order
on conflict (module_id, "order") do nothing;
