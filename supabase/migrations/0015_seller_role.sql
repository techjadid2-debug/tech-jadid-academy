-- Seller-first savdo oqimi uchun yangi rol.
-- PostgreSQL yangi enum qiymatini shu transaction ichida ishlatishga ruxsat
-- bermasligi mumkin, shuning uchun keyingi schema o'zgarishlari 0016'da.

alter type user_role add value if not exists 'seller';
