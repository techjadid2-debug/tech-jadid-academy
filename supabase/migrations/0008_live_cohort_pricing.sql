-- Jonli 2 oylik oqim uchun sotuv tariflarini yangilash.
insert into pricing_options (course_id, kind, label, price_uzs, note)
select c.id, v.kind::pay_kind, v.label, v.price_uzs, v.note
from courses c,
  (values
    ('lifetime', 'To''liq kurs uchun bir martalik to''lov', 600000, '2 oylik jonli guruh, 16 darslik platforma va barcha amaliy materiallar.'),
    ('monthly', 'Oyma-oy to''lash', 350000, 'Har oy 350 000 so''m. Kurs 2 oy davom etadi (jami 700 000 so''m).')
  ) as v(kind, label, price_uzs, note)
where c.slug = 'ai-asoslari'
on conflict (course_id, kind) do update set label = excluded.label, price_uzs = excluded.price_uzs, note = excluded.note;

delete from pricing_options p using courses c
where p.course_id = c.id and c.slug = 'ai-asoslari' and p.kind = 'installment2';

update lessons set type = 'text', video_key = null, youtube_id = null
where module_id in (select m.id from modules m join courses c on c.id = m.course_id where c.slug = 'ai-asoslari');
