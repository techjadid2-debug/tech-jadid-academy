-- Darsning to'liq materiallari xavfsiz strukturalangan JSON bloklarida saqlanadi.
alter table lessons add column if not exists content jsonb not null default '[]'::jsonb;

comment on column lessons.content is
  'heading, paragraph, image, callout, steps, prompt va task bloklaridan iborat dars materiali.';
