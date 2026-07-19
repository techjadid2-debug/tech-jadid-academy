import { createClient } from "@supabase/supabase-js";

type QuizSeed = { prompt: string; correct: string; wrong: [string, string, string]; explanation: string };
const q = (prompt: string, correct: string, wrong: [string, string, string], explanation = correct): QuizSeed => ({ prompt, correct, wrong, explanation });

const BANK: Record<number, QuizSeed[]> = {
  1: [
    q("AI natijasidagi muhim raqamni ishlatishdan oldin nima qilish kerak?", "Ishonchli manba bilan tekshirish", ["Darhol e'lon qilish", "Faqat matn uzunligiga qarash", "Javob ohangiga ishonish"]),
    q("Generativ AI'ning asosiy vazifasi qaysi?", "Yangi matn, rasm, audio yoki kod yaratish", ["Faqat fayllarni saqlash", "Internet tezligini oshirish", "Kompyuter xotirasini tozalash"]),
    q("AI bilan ishlashda yakuniy mas'uliyat kimda qoladi?", "Natijani ishlatayotgan insonda", ["Har doim modelda", "Internet provayderida", "Prompt yozgan dasturda"]),
    q("AI uchun yaxshi birinchi vazifa qanday bo'lishi kerak?", "Aniq va tekshiriladigan", ["Chegarasiz va noaniq", "Faqat bitta so'zli", "Natijasi baholab bo'lmaydigan"]),
    q("AI imkoniyatlari xaritasi nima beradi?", "Qaysi ishni tezlashtirish va nimani tekshirishni ko'rsatadi", ["Barcha ishni avtomatik topshiradi", "Xatolarni imkonsiz qiladi", "Faqat model nomlarini sanaydi"]),
  ],
  2: [
    q("Token nima?", "Model qayta ishlaydigan matn bo'lagi", ["Faqat parol turi", "Video formati", "Ma'lumotlar bazasi jadvali"]),
    q("Kontekst oynasi nimani cheklaydi?", "Model bir so'rovda hisobga ola oladigan ma'lumot hajmini", ["Monitor o'lchamini", "Internet narxini", "Fayl nomini"]),
    q("Gallyutsinatsiya deganda nima tushuniladi?", "Ishonchli ohangda noto'g'ri yoki to'qima javob", ["Modelning sekin ishlashi", "Rasmning xira chiqishi", "Login xatosi"]),
    q("Past temperature odatda qanday javob beradi?", "Barqarorroq va ehtiyotkorroq", ["Har doim uzunroq", "Faqat rasmli", "Mutlaqo tekshiruvsiz"]),
    q("Manba so'rashning o'zi nega yetarli emas?", "Model mavjud bo'lmagan manbani ham to'qishi mumkin", ["Manba faqat inglizcha bo'ladi", "Manba token ishlatmaydi", "Manba javobni qisqartiradi"]),
  ],
  3: [
    q("Model benchmarkida prompt qanday bo'lishi kerak?", "Barcha modellarda bir xil", ["Har modelda butunlay boshqa", "Natijadan keyin yozilgan", "Faqat model nomidan iborat"]),
    q("Tezlik muhim bo'lgan oddiy vazifada nimani tanlash ma'qul?", "Tez va arzon modelni", ["Eng qimmat reasoning modelini", "Faqat rasm modelini", "Hech qanday mezonsiz modelni"]),
    q("Maxfiy ma'lumot bilan ishlaganda birinchi tekshiruv nima?", "Provayderning privacy va data retention siyosati", ["Logo rangi", "Model nomining uzunligi", "Saytdagi animatsiya"]),
    q("Multimodal modelning afzalligi nima?", "Matn bilan birga rasm, audio yoki faylni tushuna olishi", ["Faqat tezroq login", "Bepul internet", "Cheksiz xotira"]),
    q("Model tanlash jadvalida nimalar bo'lishi kerak?", "Sifat, tezlik, narx va xavfsizlik", ["Faqat brend", "Faqat mashhurlik", "Faqat interfeys rangi"]),
  ],
  4: [
    q("Promptdagi kontekst nima beradi?", "Modelga vaziyat va kerakli fonni tushuntiradi", ["Parolni yashiradi", "Tokenni nolga tushiradi", "Internetni o'chiradi"]),
    q("Natija formati nega oldindan aytiladi?", "Javobni ishlatishga tayyor va tekshiriladigan qiladi", ["Modelni almashtiradi", "Har doim bepul qiladi", "Faylni avtomatik deploy qiladi"]),
    q("Cheklovga yaxshi misol qaysi?", "150 so'zdan oshirma va jadvalda yoz", ["Yaxshi yoz", "Bir narsa qil", "O'zing bilasan"]),
    q("Yomon promptni yaxshilashning birinchi qadami nima?", "Kerakli natijani aniq belgilash", ["Ko'proq undov belgisi qo'yish", "Model nomini takrorlash", "Barcha kontekstni o'chirish"]),
    q("Few-shot misollar qanday bo'lishi kerak?", "Kutilgan format va sifatni ko'rsatadigan", ["Mavzuga aloqasiz", "Faqat xato javoblardan", "Natijasiz"]),
  ],
  5: [
    q("Murakkab vazifani bosqichlash nimani yaxshilaydi?", "Nazorat va xatoni aniqlashni", ["Fayl hajmini", "Internet signalini", "Login rolini"]),
    q("Structured output qachon ayniqsa foydali?", "Natija dastur yoki jadvalga uzatilganda", ["Faqat erkin suhbatda", "Monitor o'chganda", "Parol tiklanganda"]),
    q("Sifat mezoni qayerda berilishi kerak?", "Promptning o'zida tekshiriladigan shart sifatida", ["Faqat javobdan keyin", "Model nomida", "URL ichida"]),
    q("Ko'p bosqichli prompt zanjirida keyingi qadam nimani oladi?", "Oldingi qadamning tekshirilgan natijasini", ["Tasodifiy boshqa mavzuni", "Faqat sana va vaqtni", "Bo'sh kirishni"]),
    q("AI'dan yashirin fikrlash zanjiri o'rniga nima so'raladi?", "Qisqa asos, dalil va tekshiriladigan oraliq natija", ["Cheksiz ichki monolog", "Parol", "Hech qanday natija emas"]),
  ],
  6: [
    q("Workflow'ning kirish qismi nimani belgilaydi?", "Ish boshlanishi uchun kerakli ma'lumotlarni", ["Faqat yakuniy rangni", "Internet tezligini", "Ustoz parolini"]),
    q("Prompt kutubxonasidagi versiya yozuvi nima uchun?", "Qaysi o'zgarish natijani yaxshilaganini kuzatish uchun", ["Faylni kattalashtirish uchun", "Modelni yashirish uchun", "Ballni o'chirish uchun"]),
    q("Workflow'da inson tekshiruvi qayerda bo'lishi kerak?", "Xato zarar keltirishi mumkin bo'lgan qaror oldidan", ["Hech qayerda", "Faqat login paytida", "Natija yuborilgandan ancha keyin"]),
    q("Yaxshi workflow natijasi qanday?", "Takrorlanuvchi va o'lchanadigan", ["Har safar tasodifiy", "Tekshirib bo'lmaydigan", "Faqat uzun"]),
    q("Promptni qachon yangilash kerak?", "Real ishlatishda takroriy xato yoki yangi talab chiqqanda", ["Hech qachon", "Har besh daqiqada sababsiz", "Faqat model logosi o'zgarganda"]),
  ],
  7: [
    q("Rasm promptidagi kompozitsiya nimani boshqaradi?", "Obyektlar kadrda qanday joylashishini", ["Fayl parolini", "Internet provayderini", "Audio balandligini"]),
    q("Bir parametrli iteratsiya nega foydali?", "Qaysi o'zgarish natijaga ta'sir qilganini ko'rsatadi", ["Barcha farqni yashiradi", "Rasmni matnga aylantiradi", "Modelni o'chiradi"]),
    q("Negative prompt yoki cheklov nima qiladi?", "Keraksiz element va xatolarni kamaytiradi", ["Har doim sifatni nol qiladi", "Faqat fayl nomini almashtiradi", "Promptni tarjima qiladi"]),
    q("Aspect ratio qachon tanlanadi?", "Natija ishlatiladigan platforma va formatga qarab", ["Tasodifan", "Faqat model narxiga qarab", "Login uzunligiga qarab"]),
    q("Generatsiya qilingan tijoriy rasmda yana nima tekshiriladi?", "Litsenziya, brend va shaxs huquqlari", ["Faqat piksel soni", "Faqat fayl nomi", "Faqat fon rangi"]),
  ],
  8: [
    q("Personaj bible nima?", "O'zgarmas tashqi belgilar va uslub tavsifi", ["Video subtitri", "To'lov jadvali", "API paroli"]),
    q("Izchillik uchun seed/reference bilan birga nima saqlanadi?", "Prompt, model va asosiy parametrlar", ["Faqat sana", "Faqat brauzer tarixi", "Hech narsa"]),
    q("Inpaintingda maska nimani ko'rsatadi?", "Tahrirlanadigan hududni", ["Butun internetni", "Audio yo'lini", "To'lov summasini"]),
    q("Brend vizualida qaysi elementlar o'zgarmasligi kerak?", "Rang, tipografiya va asosiy uslub", ["Har bir rasmda barcha detallar", "Fayl kengaytmasi", "Brauzer tili"]),
    q("Reference rasm ishlatishda qaysi xavf tekshiriladi?", "Mualliflik va shaxsiy tasvir huquqi", ["Token soni nol bo'lishi", "Rasmda rang bo'lishi", "Fayl nomi qisqaligi"]),
  ],
  9: [
    q("30 soniyalik video uchun storyboard nima beradi?", "Kadrlar ketma-ketligi va har kadr vazifasini", ["Faqat audio fayl nomini", "Login sahifasini", "To'lov chekini"]),
    q("B-roll nima uchun ishlatiladi?", "Asosiy hikoyani qo'shimcha kadrlar bilan boyitish uchun", ["Parolni saqlash uchun", "Modelni tanlash uchun", "Matnni o'chirish uchun"]),
    q("O'zbekcha TTS natijasida nima albatta tekshiriladi?", "Talaffuz, urg'u va ism-atamalar", ["Faqat fayl hajmi", "Faqat fon rangi", "Faqat URL"]),
    q("Platformaga mos eksportda nimalar belgilanadi?", "Aspect ratio, davomiylik, kodek va subtitr", ["Faqat prompt roli", "Faqat model brendi", "Faqat login"]),
    q("AI video ishlatishda etik talab qaysi?", "Chalg'ituvchi sintetik kontentni belgilash va ruxsatlarni tekshirish", ["Har doim manbani yashirish", "Odam ovozini ruxsatsiz klonlash", "Tekshiruvsiz e'lon qilish"]),
  ],
  10: [
    q("Vibe codingdan oldingi yaxshi spec nimadan boshlanadi?", "Foydalanuvchi muammosi va asosiy natijadan", ["Ranglar ro'yxatidan", "Eng uzun koddan", "Tasodifiy kutubxonadan"]),
    q("MVP nimani anglatadi?", "Muammoni hal qiladigan eng kichik ishlaydigan versiya", ["Barcha mumkin funksiyalar", "Faqat dizayn rasmi", "Test qilinmaydigan demo"]),
    q("AI yozgan kodga qanday munosabat kerak?", "Ishga tushirish, test va xavfsizlik tekshiruvi", ["Ko'rmasdan productionga chiqarish", "Har doim to'g'ri deb qabul qilish", "Faqat fayl nomini o'zgartirish"]),
    q("Xato haqida AI'ga nima yuboriladi?", "Aniq error, kutilgan natija va tegishli kod/kontekst", ["Faqat 'ishlamadi'", "Boshqa loyiha rasmi", "Parollar"]),
    q("Secret kalit qayerda saqlanmasligi kerak?", "Client kodi va public repository'da", ["Server environment variable'da", "Secret manager'da", "Platforma env sozlamasida"]),
  ],
  11: [
    q("Deploy oldidan eng muhim smoke test nima?", "Asosiy foydalanuvchi oqimini boshidan oxirigacha bajarish", ["Faqat bosh sahifa rangini ko'rish", "Faqat build logoni o'qish", "Testlarni o'chirish"]),
    q("Environment variable nima uchun ishlatiladi?", "Muhitga xos konfiguratsiya va secretlarni koddan ajratish", ["HTML rangini tasodifiy qilish", "Faylni zip qilish", "Testni o'tkazib yuborish"]),
    q("Production xatosini tekshirishda birinchi manba nima?", "Deploy va runtime loglari", ["Tasodifiy forum posti", "Faqat logo", "Fayl nomi"]),
    q("Rollback qachon kerak?", "Yangi deploy kritik oqimni buzsa", ["Har deploydan oldin", "Faqat rang o'zgarsa", "Hech qachon"]),
    q("Jonli URL tekshiruvida nimani sinash kerak?", "Mobil/desktop, auth, forma va ma'lumot saqlanishini", ["Faqat URL uzunligini", "Faqat brauzer ikonkasini", "Faqat font nomini"]),
  ],
  12: [
    q("AI funksiyaning input validatsiyasi nimani oldini oladi?", "Noto'g'ri, ortiqcha va zararli so'rovlarni", ["Barcha model xatolarini", "Internet uzilishini", "Monitor buzilishini"]),
    q("API kalit nega serverda qolishi kerak?", "Clientdan o'g'irlanishi va ruxsatsiz xarajatni oldini olish uchun", ["Javobni uzun qilish uchun", "Dizaynni yaxshilash uchun", "Tokenni ko'paytirish uchun"]),
    q("AI endpoint uchun rate limit nima beradi?", "Suiiste'mol va nazoratsiz xarajatni cheklaydi", ["Har javobni to'g'ri qiladi", "Faylni tarjima qiladi", "Loginni olib tashlaydi"]),
    q("Fallback UI qachon ko'rsatiladi?", "Model yoki tarmoq vaqtincha ishlamaganda", ["Faqat hamma narsa ishlaganda", "Builddan oldin", "Parol yozilganda"]),
    q("AI natijasi muhim qarorga ta'sir qilsa nima kerak?", "Inson tekshiruvi va tushunarli tuzatish yo'li", ["Avtomatik yuborish", "Natijani yashirish", "Loglarni o'chirish"]),
  ],
  13: [
    q("Agent tool chaqirig'ida least privilege nima?", "Faqat vazifa uchun zarur eng kam ruxsat", ["Barcha tizimga admin ruxsati", "Parolsiz ochiq kirish", "Cheksiz xarajat"]),
    q("MCP serverga ulanishdan oldin nima tekshiriladi?", "Manba, ruxsatlar va uzatiladigan ma'lumot", ["Faqat logo", "Faqat port raqami", "Faqat model nomi"]),
    q("Qaysi agent qadami inson tasdig'ini talab qiladi?", "Pul yuborish yoki ma'lumotni o'chirish kabi qaytarib bo'lmas amal", ["Matn draftini ko'rsatish", "Ochiq hujjatni o'qish", "Reja taklif qilish"]),
    q("Agent logi nima uchun kerak?", "Qaysi tool, input va qaror ishlatilganini audit qilish uchun", ["Faylni kattalashtirish uchun", "Modelni yashirish uchun", "Rang tanlash uchun"]),
    q("Agent xatosida xavfsiz default nima?", "Amalni to'xtatib, foydalanuvchidan aniqlik yoki tasdiq olish", ["Taxmin bilan o'chirish", "Cheksiz qayta urinish", "Ruxsatni kengaytirish"]),
  ],
  14: [
    q("Telegram webhook secret nima uchun?", "So'rov haqiqatan Telegram'dan kelganini tekshirish uchun", ["Bot rasmini o'zgartirish uchun", "Chatni public qilish uchun", "Modelni o'rgatish uchun"]),
    q("Bot foydalanuvchini qanday ajratishi kerak?", "Barqaror Telegram user/chat ID orqali", ["Faqat ism orqali", "Xabar uzunligi orqali", "Tasodifiy raqam orqali"]),
    q("Botdagi /start payload nima beradi?", "Foydalanuvchini aniq buyurtma yoki oqimga bog'laydi", ["Parolni public qiladi", "Barcha chatni o'chiradi", "AI modelni almashtiradi"]),
    q("Webhook handler nega idempotent bo'lishi kerak?", "Bir update qayta kelsa amal takrorlanmasligi uchun", ["Javobni uzun qilish uchun", "Rasm sifatini oshirish uchun", "Tokenni ko'paytirish uchun"]),
    q("Bot secretlari qayerda turadi?", "Server environment variable yoki secret manager'da", ["Client JavaScript'da", "Telegram xabarida", "README'ning ochiq qismida"]),
  ],
  15: [
    q("AI workflow uchun yaxshi boshlang'ich jarayon qaysi?", "Takrorlanadigan, vaqt oladigan va natijasi o'lchanadigan ish", ["Yiliga bir marta bo'ladigan noaniq ish", "Mas'uliyatsiz kritik qaror", "Natijasini ko'rib bo'lmaydigan ish"]),
    q("Before/after o'lchovida nima solishtiriladi?", "Vaqt, sifat, xato va xarajat", ["Faqat prompt uzunligi", "Faqat model logosi", "Faqat fayl nomi"]),
    q("Kasbiy AI oqimida maxfiy ma'lumot bilan nima qilinadi?", "Anonimlashtiriladi yoki ruxsatli xavfsiz muhit ishlatiladi", ["Har doim public chatga yuboriladi", "Tekshiruvsiz nusxalanadi", "Logga to'liq yoziladi"]),
    q("Workflow muvaffaqiyat mezoni qanday bo'lishi kerak?", "Oldindan belgilangan va o'lchanadigan", ["Faqat 'yaxshi' degan so'z", "Har safar o'zgaradigan", "Natijadan keyin o'ylab topilgan"]),
    q("Avtomatlashtirishni qachon kengaytirish kerak?", "Kichik oqim barqaror ishlashi va xatolar nazorat qilingandan keyin", ["Birinchi urinishdayoq hamma jarayonga", "Tekshiruvsiz", "Mas'ul shaxs bo'lmaganda"]),
  ],
  16: [
    q("Capstone case study qaysi uchlikni ko'rsatadi?", "Muammo, yechim jarayoni va natija", ["Faqat tool logolari", "Faqat sertifikat", "Faqat uzun kod"]),
    q("Portfolio natijasini kuchaytiradigan dalil nima?", "Demo, o'lchov yoki foydalanuvchi feedbacki", ["Umumiy va'da", "Manbasiz raqam", "Faqat rangli fon"]),
    q("Xizmat taklifi nimadan boshlanadi?", "Aniq mijoz muammosi va beriladigan qiymatdan", ["Eng yangi model nomidan", "Tasodifiy narxdan", "Logo tanlashdan"]),
    q("Birinchi monetizatsiya tajribasi qanday bo'lishi kerak?", "Tor auditoriya uchun kichik, aniq va sinov qilinadigan taklif", ["Hamma uchun cheksiz xizmat", "Natijasiz katta va'da", "Narxsiz noaniq e'lon"]),
    q("Portfolio'da maxfiy mijoz ishini qanday ko'rsatish kerak?", "Ruxsat olib, shaxsiy ma'lumotni yashirib yoki anonim case qilish", ["To'liq ma'lumotni ruxsatsiz chiqarish", "Parollarni qo'shish", "Mijoz nomidan soxta izoh yozish"]),
  ],
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase URL/service key topilmadi");
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: lessons, error } = await admin
    .from("lessons")
    .select("id, order, modules!inner(courses!inner(slug))")
    .eq("modules.courses.slug", "ai-asoslari");
  if (error || !lessons) throw error ?? new Error("Darslar topilmadi");

  let created = 0;
  for (const lesson of lessons) {
    const seeds = BANK[Number(lesson.order)] ?? [];
    for (const [index, seed] of seeds.entries()) {
      const order = index + 4;
      const { data: existing } = await admin.from("quiz_questions").select("id")
        .eq("lesson_id", lesson.id).eq("order", order).maybeSingle();
      if (existing) continue;
      const { data: question, error: questionError } = await admin.from("quiz_questions").insert({
        lesson_id: lesson.id, order, prompt: seed.prompt, explanation: seed.explanation, points: 10,
      }).select("id").single();
      if (questionError || !question) throw questionError ?? new Error("Savol yaratilmadi");
      const options = [seed.correct, ...seed.wrong];
      const { error: optionError } = await admin.from("quiz_options").insert(options.map((text, optionIndex) => ({
        question_id: question.id, order: optionIndex + 1, text, is_correct: optionIndex === 0,
      })));
      if (optionError) {
        await admin.from("quiz_questions").delete().eq("id", question.id);
        throw optionError;
      }
      created += 1;
    }
  }
  console.log(`Tayyor — ${created} yangi savol qo'shildi; har darsda 8 tadan savol bor.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
