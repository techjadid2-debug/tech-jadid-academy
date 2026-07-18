-- 0005'dagi enforce_course_lesson_order() trigger funksiyasi uchun revoke/grant
-- qatori yo'q edi (unlike sibling funksiyalar) — shuning uchun PostgREST uni
-- anon/authenticated uchun RPC sifatida ochiq qoldirgan (faqat trigger konteksti
-- uchun mo'ljallangan). Bu yerda tuzatiladi.
revoke all on function public.enforce_course_lesson_order() from public, anon, authenticated;
