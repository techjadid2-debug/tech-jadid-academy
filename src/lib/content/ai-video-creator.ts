import type { LessonContentBlock } from "../types";
import { labLesson } from "./lab";

// ============================================================================
// AI Video Creator — 16 dars uchun to'liq material (global order 1..16).
// Har dars 120 daqiqalik project lab. Free→Pro vosita tavsiyalari bilan.
// ============================================================================

export const VIDEO_CREATOR_MATERIALS: Record<number, LessonContentBlock[]> = {
  1: labLesson({
    overview:
      "Generativ AI matn, rasm, ovoz va videoni yaratadigan modellar oilasi. Video creator uchun bu — g'oyadan tayyor kadar va ovozgacha bo'lgan butun ishlab chiqarish quvvati. Bugun asosiy modellar va ular nima uchun mos kelishini tushunasiz.",
    keyPoint:
      "Model qanchalik kuchli bo'lmasin, natija sifati sizning aniq ko'rsatmangizga bog'liq. AI — ishlab chiqarishni tezlashtiradi, lekin ijodiy qarorni siz qabul qilasiz.",
    steps: [
      "ChatGPT, Claude va Gemini'da bir xil ijodiy vazifani sinang (masalan, 15 soniyalik reel g'oyasi).",
      "Rasm va video modellari qanday farq qilishini ko'rib chiqing (LLM vs diffusion vs video model).",
      "O'zingizga yaqin bitta niche tanlang (mahsulot, ta'lim, ko'ngilochar) va shu bo'yicha ishlaysiz.",
    ],
    tools: {
      items: [
        { name: "ChatGPT", free: "Bepul: GPT-5 mini bilan g'oya, ssenariy, matn", pro: "Plus (~$20/oy): tezroq, kuchliroq model + ko'proq limit" },
        { name: "Claude", free: "Bepul: kunlik cheklangan suhbat, uzun matn", pro: "Pro (~$20/oy): katta hajm, izchil ijodiy yozuv" },
        { name: "Google Gemini", free: "Bepul: matn + rasm tahlili, Google integratsiya", pro: "AI Pro: Veo video va yuqori limitlar" },
      ],
    },
    prompt: {
      title: "Niche va format prompti",
      text: "Men AI video creator bo'lmoqchiman. Mening niche'im: [mavzu]. Auditoriyam: [kim].\n\nShu niche uchun 5 ta qisqa video g'oyasi ber. Har biri uchun: hook (birinchi 3 soniya), asosiy fikr va call-to-action yoz.",
    },
    task: {
      text: "O'z niche'ingizni tanlang va uch xil modeldan olingan g'oyalardan eng kuchli ikkitasini saqlang.",
      checklist: [
        "Niche va auditoriyani bitta gap bilan aniqladingiz.",
        "Kamida 3 modelda bir vazifani sinadingiz.",
        "Eng yaxshi 2 g'oyani alohida saqladingiz.",
        "Qaysi model qaysi ishga mosligini belgiladingiz.",
      ],
    },
  }),
  2: labLesson({
    overview:
      "Creator uchun prompt — bu ijodiy brief. Yaxshi prompt rol, kontekst, uslub, kadr va cheklovlarni aniq beradi. Bugun matn, rasm va video promptlariga birdek yaroqli anatomiyani o'rganasiz.",
    keyPoint:
      "Noaniq prompt = tasodifiy natija. Uslub, ohang va aniq maqsad qo'shilsa, qayta ishlashga ketadigan vaqt keskin kamayadi.",
    steps: [
      "Yomon promptni (masalan 'video g'oya ber') kuchli briefga aylantiring.",
      "Bitta g'oyani uch xil ohangda yozdiring: hazil, jiddiy, ilhomlantiruvchi.",
      "AI'dan o'zingizga prompt yozib berishini so'rang (meta-prompting).",
    ],
    tools: {
      items: [
        { name: "ChatGPT", free: "Bepul: prompt yozish va tahrirlash", pro: "Plus: Custom GPT'lar va xotira bilan izchil workflow" },
        { name: "Claude", free: "Bepul: uzun, tuzilgan ijodiy briefe", pro: "Pro: Projects bilan uslub kutubxonasini saqlash" },
      ],
    },
    prompt: {
      title: "Universal creator brief",
      text: "Rol: sen tajribali [kontent yo'nalishi] ssenariynavisisan.\nVazifa: [natija] tayyorla.\nAuditoriya: [kim]. Ohang: [uslub]. Platforma: [Reels/Shorts/TikTok].\nCheklov: [davomiylik, til, taqiqlangan narsalar].\nAvval 3 ta variant ber, keyin eng kuchlisini kengaytir.",
    },
    task: {
      text: "O'z niche'ingiz uchun 3 ta qayta ishlatiladigan prompt shabloni yarating: g'oya, ssenariy va hook uchun.",
      checklist: [
        "Har promptda rol, kontekst, format va cheklov bor.",
        "Bitta g'oyani turli ohangda sinadingiz.",
        "Meta-prompting bilan promptni yaxshiladingiz.",
        "Shablonlarni prompt kutubxonangizga saqladingiz.",
      ],
    },
  }),
  3: labLesson({
    overview:
      "Bugun creator ish oqimidagi vositalarni tanlashni o'rganasiz: qaysi ish uchun qaysi model, qaysisi bepul limitda yetarli va qachon Pro tarif zarur. Maqsad — byudjetni to'g'ri sarflash.",
    keyPoint:
      "Har bir vosita uchun avval bepul/limitli tarifda mahoratni oshiring; faqat doimiy ishlab chiqarishga o'tganda pullik Pro'ga o'ting.",
    steps: [
      "Ish oqimini bosqichlarga ajrating: g'oya → rasm → video → ovoz → montaj.",
      "Har bosqich uchun bitta bepul va bitta Pro variantni yozing.",
      "O'zingizga oylik minimal tool byudjetini rejalang.",
    ],
    tools: {
      title: "Creator tool steki — Free vs Pro",
      items: [
        { name: "Matn/ssenariy", free: "ChatGPT / Claude bepul", pro: "ChatGPT Plus yoki Claude Pro" },
        { name: "Rasm", free: "Gemini, Ideogram bepul limit", pro: "Midjourney (~$10/oy) yoki Flux Pro" },
        { name: "Video", free: "Runway/Kling bepul kredit", pro: "Runway/Kling/Veo Pro obuna" },
        { name: "Ovoz", free: "ElevenLabs bepul belgilar", pro: "ElevenLabs Starter/Creator" },
        { name: "Montaj", free: "CapCut bepul", pro: "CapCut Pro" },
      ],
    },
    prompt: {
      title: "Tool tanlash yordamchisi",
      text: "Men [natija] tayyorlamoqchiman. Byudjetim oyiga [summa].\n\nShu vazifa uchun bepul va pullik variantlarni solishtir. Qaysi bosqichda pullik tarif haqiqatan zarur, qaysida bepul yetarli — jadval qilib ko'rsat.",
    },
    task: {
      text: "Shaxsiy creator tool stekingizni bir sahifada yozing: har bosqich uchun bepul va Pro variant hamda oylik byudjet.",
      checklist: [
        "Ish oqimini 5 bosqichga ajratdingiz.",
        "Har bosqichga bepul + Pro variant belgiladingiz.",
        "Oylik byudjetni hisobladingiz.",
        "Qaysi Pro tarifni birinchi olishni aniqladingiz.",
      ],
    },
  }),
  4: labLesson({
    overview:
      "AI rasm generatsiyasi — diffusion modellari asosida ishlaydi. Bugun subyekt, kompozitsiya, uslub, yorug'lik va aspect ratio'ni boshqarishni o'rganasiz. Bu keyingi video kadrlaringiz uchun poydevor.",
    keyPoint:
      "Eng yaxshi rasm bir urinishda emas, bitta parametrni o'zgartirib iteratsiya qilishda chiqadi. Har safar hammasini o'zgartirmang.",
    steps: [
      "Bitta aniq sahnani tasvirlab yozing: subyekt + joy + yorug'lik + uslub.",
      "Aspect ratio'ni platformaga moslang (9:16 Reels/Shorts uchun).",
      "Bir g'oyani 3 xil uslubda generatsiya qiling va solishtiring.",
    ],
    tools: {
      items: [
        { name: "Midjourney", free: "Bepul tarif yo'q — trial cheklangan", pro: "Basic (~$10/oy): eng yuqori badiiy sifat", note: "Creatorlar orasida standart" },
        { name: "Flux", free: "Bepul: fal.ai / Freepik orqali cheklangan generatsiya", pro: "Flux Pro / Ultra: fotorealistik natija" },
        { name: "Ideogram", free: "Bepul kunlik kredit, matnli rasmda kuchli", pro: "Plus: ko'proq generatsiya + xususiy rejim" },
        { name: "Google Gemini / GPT Image", free: "Bepul: tez konsept rasmlar", pro: "Pro obunada yuqori limit" },
      ],
    },
    prompt: {
      title: "Rasm prompti shabloni",
      text: "[subyekt], [harakat/holat], [joy va fon], [yorug'lik], [uslub: kino/3D/anime], [kamera: yaqin plan/keng kadr], --ar 9:16",
    },
    task: {
      text: "O'z niche'ingiz uchun bitta g'oyani 3 uslubda generatsiya qilib, eng mos kadrni tanlang.",
      checklist: [
        "Subyekt, joy, yorug'lik va uslubni aniq yozdingiz.",
        "9:16 formatda generatsiya qildingiz.",
        "Bitta parametrni o'zgartirib iteratsiya qildingiz.",
        "Eng kuchli kadrni saqladingiz.",
      ],
    },
  }),
  5: labLesson({
    overview:
      "Brend va seriyali kontentda personaj, mahsulot va uslub izchilligi hal qiluvchi. Bugun bir personajni yoki mahsulotni turli sahnalarda bir xil ko'rinishda saqlashni o'rganasiz.",
    keyPoint:
      "Izchillik — o'zgarmas elementlarni (yuz, rang, uslub) qat'iy saqlab, faqat sahna yoki harakatni almashtirishdir.",
    steps: [
      "Personaj yoki mahsulot uchun 'bible' yozing: o'zgarmas belgilar ro'yxati.",
      "Reference rasm + character reference (masalan Midjourney --cref) bilan sinang.",
      "Bir personajni 3 sahnada izchil chiqaring.",
    ],
    tools: {
      items: [
        { name: "Midjourney", free: "Trial cheklangan", pro: "Basic+: --cref character reference bilan izchillik" },
        { name: "Flux / Leonardo", free: "Bepul kredit + reference", pro: "Pro: character/style lock, ko'proq nazorat" },
      ],
    },
    prompt: {
      title: "Izchillik brief",
      text: "Personaj: [tavsif — o'zgarmas belgilar].\nUslub: [rang, yorug'lik, kamera].\nSahna: [yangi joy va harakat].\nMuhim: yuz, kiyim va uslub oldingi kadr bilan bir xil qolsin; faqat sahna o'zgarsin.",
    },
    task: {
      text: "Bitta personaj yoki mahsulot uchun 3 sahnali izchil vizual seriya yarating.",
      checklist: [
        "O'zgarmas belgilar ro'yxatini yozdingiz.",
        "Reference/character reference ishlatdingiz.",
        "3 sahnada izchillikni saqladingiz.",
        "Farqli va izchil kadrlarni ajratib oldingiz.",
      ],
    },
  }),
  6: labLesson({
    overview:
      "Har bir kuchli video g'oyadan boshlanadi. Bugun hook (birinchi 3 soniya), asosiy fikr va ssenariy strukturasini o'rganasiz. Hook — tomoshabin qoladimi yoki ketadimi, shuni hal qiladi.",
    keyPoint:
      "Birinchi 3 soniyada tomoshabinni ushlamasangiz, qolgan ssenariy ahamiyatsiz. Hook ustida alohida ishlang.",
    steps: [
      "Bitta g'oya uchun 5 xil hook yozing (savol, kutilmagan fakt, muammo, va'da, intriga).",
      "Ssenariyni 3 qismga bo'ling: hook → qiymat → CTA.",
      "15-30 soniyaga sig'adigan qilib qisqartiring.",
    ],
    tools: {
      items: [
        { name: "ChatGPT / Claude", free: "Bepul: hook va ssenariy variantlari", pro: "Plus/Pro: izchil ssenariy seriyasi va xotira" },
      ],
    },
    prompt: {
      title: "Hook + ssenariy generatori",
      text: "Mavzu: [g'oya]. Platforma: [Reels/Shorts]. Davomiylik: [soniya].\n\n1) 5 xil hook yoz (har biri 3 soniyada aytiladigan).\n2) Eng kuchlisini tanlab, to'liq ssenariy yoz: hook → asosiy qiymat → CTA.\nOg'zaki, tabiiy o'zbek tilida yoz.",
    },
    task: {
      text: "O'z niche'ingiz uchun bitta 20-30 soniyalik video ssenariysini hook bilan yozing.",
      checklist: [
        "5 xil hook yozib, eng kuchlisini tanladingiz.",
        "Ssenariy hook → qiymat → CTA strukturasida.",
        "Davomiylikka sig'diringiz.",
        "Til tabiiy va og'zaki.",
      ],
    },
  }),
  7: labLesson({
    overview:
      "Storyboard va shot list — ssenariyni kadrlarga aylantiradi. Bugun har bir gapni aniq kadrga, kamera burchagiga va davomiyligiga bog'lashni o'rganasiz. Bu video generatsiyasini tartibli qiladi.",
    keyPoint:
      "Avval kadrlar ketma-ketligini qog'ozda hal qiling; generatsiyaga o'tishdan oldin nima kerakligini aniq biling.",
    steps: [
      "Ssenariyni 4-6 kadrga ajrating.",
      "Har kadr uchun: tasvir, kamera burchagi, davomiylik va ovoz.",
      "Har kadr uchun reference rasm generatsiya qiling.",
    ],
    tools: {
      items: [
        { name: "ChatGPT / Claude", free: "Bepul: shot list jadvali", pro: "Plus/Pro: uzun loyihalarda izchillik" },
        { name: "Midjourney / Flux", free: "Kadr referencelari uchun bepul limit", pro: "Pro: yuqori sifatli storyboard kadrlari" },
      ],
    },
    prompt: {
      title: "Shot list generatori",
      text: "Quyidagi ssenariyni shot list qilib jadvalga sol: [ssenariy].\nHar qator: kadr raqami | tasvir | kamera burchagi | davomiylik (soniya) | ovoz/matn.\n4-6 kadrga sig'dir.",
    },
    task: {
      text: "Oldingi ssenariyingiz uchun to'liq shot list va har kadrga reference kadr tayyorlang.",
      checklist: [
        "Ssenariy 4-6 kadrga ajratilgan.",
        "Har kadrda kamera va davomiylik bor.",
        "Har kadrga reference rasm generatsiya qildingiz.",
        "Ketma-ketlik mantiqiy va izchil.",
      ],
    },
  }),
  8: labLesson({
    overview:
      "AI video prompti o'ziga xos til. Bugun subyekt, harakat, kamera, yorug'lik va uslubni video model tushunadigan tarzda yozishni o'rganasiz. Yaxshi prompt — barqaror kadr.",
    keyPoint:
      "Video promptda harakat va kamera harakatini aniq yozing: model 'nima o'zgaradi'ni bilishi kerak, statik tasvir emas.",
    steps: [
      "Bir kadrni to'liq video promptga aylantiring (subyekt + harakat + kamera + muhit).",
      "Image-to-video uchun boshlang'ich kadr + harakat tavsifini bering.",
      "Bir promptni bir necha marta generatsiya qilib, barqarorlikni baholang.",
    ],
    tools: {
      items: [
        { name: "Runway", free: "Bepul: cheklangan kredit bilan sinov", pro: "Standard+ (~$12/oy): Gen-4, yuqori sifat" },
        { name: "Kling AI", free: "Bepul kunlik kredit", pro: "Pro: uzunroq, sifatliroq kadrlar" },
      ],
    },
    prompt: {
      title: "Video prompt anatomiyasi",
      text: "[subyekt] [aniq harakat], [kamera harakati: dolly in / pan / static], [muhit va yorug'lik], [uslub: kino/realistik], [davomiylik]. Yumshoq, tabiiy harakat.",
    },
    task: {
      text: "Bitta kadr uchun to'liq video prompt yozib, uni generatsiya qilib barqarorligini tekshiring.",
      checklist: [
        "Promptda subyekt, harakat va kamera bor.",
        "Yorug'lik va uslub aniqlangan.",
        "Bir necha marta generatsiya qildingiz.",
        "Eng barqaror natijani tanladingiz.",
      ],
    },
  }),
  9: labLesson({
    overview:
      "Text-to-video va image-to-video — ikki asosiy yondashuv. Bugun qaysi biri qachon mos kelishini va real video modellarda ishlashni o'rganasiz. Image-to-video ko'pincha ko'proq nazorat beradi.",
    keyPoint:
      "Izchillik kerak bo'lsa, avval kuchli boshlang'ich kadr generatsiya qiling, keyin uni image-to-video qiling — bu natijani nazoratliroq qiladi.",
    steps: [
      "Bir g'oyani text-to-video va image-to-video'da sinab, farqni ko'ring.",
      "Storyboard kadrlaringizni image-to-video bilan jonlantiring.",
      "Kadrlarni ketma-ket generatsiya qilib, mini-sekvensiya yig'ing.",
    ],
    tools: {
      items: [
        { name: "Runway Gen-4", free: "Bepul kredit bilan sinov", pro: "Pro: yuqori sifat, ko'proq generatsiya" },
        { name: "Kling AI", free: "Bepul kunlik kredit", pro: "Pro: uzun kadr, image-to-video kuchli" },
        { name: "Luma Dream Machine", free: "Bepul limit", pro: "Plus: tezroq va sifatliroq" },
        { name: "Google Veo", free: "Gemini'da cheklangan", pro: "Google AI Pro/Ultra: eng realistik video", note: "Kuchli, lekin qimmatroq" },
      ],
    },
    prompt: {
      title: "Image-to-video harakati",
      text: "Boshlang'ich kadr: [tavsif].\nHarakat: [subyekt nima qiladi] + [kamera: sekin dolly in].\nDavomiylik: [soniya]. Yumshoq, realistik, ortiqcha buzilishsiz.",
    },
    task: {
      text: "Storyboardingizdagi 2-3 kadrni video qilib, mini-sekvensiyaga birlashtiring.",
      checklist: [
        "Text-to-video va image-to-video farqini ko'rdingiz.",
        "Kadrlarni izchil generatsiya qildingiz.",
        "Buzilgan kadrlarni qayta ishladingiz.",
        "2-3 kadrni ketma-ket yig'dingiz.",
      ],
    },
  }),
  10: labLesson({
    overview:
      "Kamera harakati va motion control kadrni jonlantiradi. Bugun dolly, pan, zoom, orbit kabi harakatlarni va motion control vositalarini boshqarishni o'rganasiz.",
    keyPoint:
      "Kamera harakati hikoyaga xizmat qilishi kerak: har kadrda 'nega bu harakat?' degan savolga javob bo'lsin.",
    steps: [
      "Bir kadrni 3 xil kamera harakati bilan generatsiya qiling.",
      "Motion control / brush bilan aniq harakatni boshqaring.",
      "Kamera harakatini hikoya ohangiga moslang (tinch yoki dinamik).",
    ],
    tools: {
      items: [
        { name: "Runway", free: "Bepul kredit: camera motion", pro: "Pro: Motion Brush va aniq nazorat" },
        { name: "Kling AI", free: "Bepul: kamera harakati presetlari", pro: "Pro: kuchliroq motion control" },
        { name: "Higgsfield", free: "Bepul limit: kino kamera harakatlari", pro: "Pro: keng preset va yuqori sifat" },
      ],
    },
    prompt: {
      title: "Kamera harakati prompti",
      text: "[kadr]. Kamera: [dolly in / orbit left / crane up / static], tezlik: [sekin/o'rtacha]. Harakat hikoyaga mos, silliq va professional bo'lsin.",
    },
    task: {
      text: "Bitta kadrni turli kamera harakatlari bilan sinab, hikoyaga eng mosini tanlang.",
      checklist: [
        "Kamida 3 xil kamera harakatini sinadingiz.",
        "Motion control vositasini ishlatdingiz.",
        "Harakatni hikoya ohangiga moslashtirdingiz.",
        "Eng kuchli variantni tanladingiz.",
      ],
    },
  }),
  11: labLesson({
    overview:
      "Videoda personaj va mahsulot izchilligini saqlash — brend uchun kritik. Bugun bir personaj yoki mahsulotni bir necha video kadrda bir xil ko'rinishda saqlashni o'rganasiz.",
    keyPoint:
      "Video izchilligi boshlang'ich kadrdan boshlanadi: kuchli, izchil reference kadr — barqaror video demakdir.",
    steps: [
      "Izchil reference kadrlar to'plamini tayyorlang.",
      "Har video kadrni bir xil reference'dan boshlang.",
      "Rang va yorug'likni montajda moslang.",
    ],
    tools: {
      items: [
        { name: "Kling Elements", free: "Bepul: subyekt/element referencelari", pro: "Pro: kuchli izchillik nazorati" },
        { name: "Runway References", free: "Bepul kredit", pro: "Pro: character/style references" },
      ],
    },
    prompt: {
      title: "Video izchillik brief",
      text: "Reference: [personaj/mahsulot tavsifi].\nHar kadrda yuz/logo/rang bir xil qolsin.\nSahna: [yangi joy]. Harakat: [tavsif]. Uslub va yorug'lik oldingi kadr bilan mos.",
    },
    task: {
      text: "Bitta personaj yoki mahsulot bilan 3 kadrli izchil video seriya yarating.",
      checklist: [
        "Izchil reference kadrlar tayyorladingiz.",
        "Har video bir xil reference'dan boshlanadi.",
        "Rang/yorug'likni moslashtirdingiz.",
        "Izchillik 3 kadrda saqlangan.",
      ],
    },
  }),
  12: labLesson({
    overview:
      "Lip-sync va o'zbekcha ovoz — kontentni mahalliy auditoriyaga yaqinlashtiradi. Bugun matndan tabiiy ovoz yaratish, dublyaj va lab harakatini moslashtirishni o'rganasiz.",
    keyPoint:
      "O'zbekcha TTS natijasini har doim eshitib tekshiring: talaffuz, urg'u va atamalar tabiiy chiqishi kerak. Boshqa ovozni ruxsatsiz klonlamang.",
    steps: [
      "Matnni ElevenLabs yoki shunga o'xshash vositada ovozga aylantiring.",
      "Lip-sync vosita bilan personaj labini ovozga moslang.",
      "Talaffuz va urg'uni tekshirib, kerakli joyni qayta yozing.",
    ],
    tools: {
      items: [
        { name: "ElevenLabs", free: "Bepul: cheklangan belgilar, ko'p til", pro: "Starter/Creator (~$5-22/oy): ko'proq ovoz + dublyaj" },
        { name: "HeyGen", free: "Bepul: cheklangan avatar video", pro: "Pro: lip-sync avatar va dublyaj" },
        { name: "Hedra / Runway Act-One", free: "Bepul kredit: yuz + ovoz", pro: "Pro: sifatli lip-sync va ifoda" },
      ],
    },
    prompt: {
      title: "Ovoz uchun matn tayyorlash",
      text: "Quyidagi ssenariyni ovozlashtirishga tayyorla: [matn].\nTabiiy og'zaki o'zbek tilida, qisqa gaplar bilan yoz. Urg'u tushadigan so'zlarni belgila. Begona atamalarni o'zbekcha talaffuzga moslab yoz.",
    },
    task: {
      text: "Videongizga o'zbekcha ovoz qo'shing va lip-sync yoki subtitr bilan moslang.",
      checklist: [
        "Matnni tabiiy ovozga aylantirdingiz.",
        "Talaffuz va urg'uni tekshirdingiz.",
        "Lip-sync yoki subtitr bilan moslashtirdingiz.",
        "Ruxsat masalasini (ovoz huquqi) hisobga oldingiz.",
      ],
    },
  }),
  13: labLesson({
    overview:
      "Musiqa va sound design videoning hissiyotini belgilaydi. Bugun AI bilan fon musiqasi, sound effekt va audio balansni yaratishni o'rganasiz.",
    keyPoint:
      "Musiqa hikoyaga bo'ysunishi kerak — ovoz ustidan bosib ketmasin. Litsenziyani ham tekshiring.",
    steps: [
      "Video ohangiga mos fon musiqa generatsiya qiling.",
      "Muhim lahzalarga sound effekt qo'shing.",
      "Musiqa, ovoz va effektlar balansini sozlang.",
    ],
    tools: {
      items: [
        { name: "Suno", free: "Bepul: kunlik kreditlar bilan musiqa", pro: "Pro (~$10/oy): tijoriy huquq + ko'proq generatsiya" },
        { name: "Udio", free: "Bepul kredit", pro: "Standard: yuqori sifat + tijoriy foydalanish" },
        { name: "ElevenLabs SFX", free: "Bepul: sound effekt generatsiya", pro: "Obunada ko'proq limit" },
      ],
    },
    prompt: {
      title: "Fon musiqa brief",
      text: "Video mavzusi: [tavsif]. Ohang: [tinch/energik/hissiy]. Davomiylik: [soniya]. Janr: [tavsif]. Vokalsiz, fon uchun, ovoz ustidan bosmaydigan.",
    },
    task: {
      text: "Videongizga mos fon musiqa va kamida bitta sound effekt qo'shib, balansni sozlang.",
      checklist: [
        "Video ohangiga mos musiqa generatsiya qildingiz.",
        "Muhim lahzaga effekt qo'shdingiz.",
        "Audio balansni sozladingiz.",
        "Litsenziya/tijoriy huquqni tekshirdingiz.",
      ],
    },
  }),
  14: labLesson({
    overview:
      "CapCut'da montaj — barcha kadr, ovoz va musiqani bitta ravon videoga birlashtirasiz. Bugun kesish, o'tishlar, subtitr va eksportni o'rganasiz.",
    keyPoint:
      "Montaj ritmi tomoshabinni ushlab turadi: keraksiz lahzalarni ayovsiz kesing. Har soniya qiymat bersin.",
    steps: [
      "Kadrlarni ssenariy tartibida timeline'ga joylang.",
      "O'tish, subtitr va ovozni moslang.",
      "Platformaga mos formatda (9:16, subtitr bilan) eksport qiling.",
    ],
    tools: {
      items: [
        { name: "CapCut", free: "Bepul: montaj, subtitr, effekt (asosiy)", pro: "Pro (~$8/oy): premium effekt, watermarksiz, ko'proq eksport" },
      ],
    },
    prompt: {
      title: "Montaj rejasi",
      text: "Quyidagi kadrlar uchun montaj rejasini yoz: [kadrlar ro'yxati].\nHar kadr davomiyligi, o'tish turi, subtitr matni va musiqa kirish nuqtasini belgila. Umumiy davomiylik: [soniya].",
    },
    task: {
      text: "Barcha kadr, ovoz va musiqani CapCut'da bitta tayyor videoga birlashtiring.",
      checklist: [
        "Kadrlar ssenariy tartibida joylashtirilgan.",
        "Subtitr va o'tishlar qo'shilgan.",
        "Audio balans to'g'ri.",
        "9:16 formatda eksport qildingiz.",
      ],
    },
  }),
  15: labLesson({
    overview:
      "Kontent formatlari va monetizatsiya — mehnatingizni daromadga aylantiradi. Bugun platforma formatlari, kontent seriyasi va daromad yo'llarini o'rganasiz.",
    keyPoint:
      "Monetizatsiya bitta viral videodan emas, izchil formatdan va aniq auditoriyadan boshlanadi.",
    steps: [
      "Niche'ingiz uchun 3 ta takrorlanadigan format yozing.",
      "Daromad yo'llarini rejalang: buyurtma video, brend hamkorlik, o'z mahsulot.",
      "Birinchi taklifingizni (xizmat yoki paket) tuzing.",
    ],
    tools: {
      items: [
        { name: "ChatGPT / Claude", free: "Bepul: kontent-reja va taklif matni", pro: "Plus/Pro: kalendar va seriyani boshqarish" },
      ],
    },
    prompt: {
      title: "Monetizatsiya rejasi",
      text: "Niche: [mavzu]. Auditoriya: [kim]. Menda [ko'nikma/portfolio] bor.\n\n3 ta daromad yo'lini taklif qil (masalan buyurtma video, brend, mahsulot). Har biri uchun: kimga sotaman, narx diapazoni va birinchi qadam.",
    },
    task: {
      text: "Shaxsiy kontent + monetizatsiya rejasini bir sahifada yozing.",
      checklist: [
        "3 ta takrorlanadigan format aniqlandi.",
        "Kamida 2 daromad yo'li belgilandi.",
        "Birinchi taklif/paket tuzildi.",
        "Narx diapazoni yozildi.",
      ],
    },
  }),
  16: labLesson({
    overview:
      "Capstone — o'rgangan hamma narsani bitta professional AI videoda birlashtirasiz: g'oya, ssenariy, storyboard, kadrlar, ovoz, musiqa va montaj. Bu portfolio ishingiz bo'ladi.",
    keyPoint:
      "Capstone — 'kurs o'tdim' emas, ko'rsatadigan mahsulot. Uni mijoz yoki ish beruvchiga namoyish qilsa bo'ladigan darajada yakunlang.",
    steps: [
      "G'oyadan montajgacha butun pipeline'ni bosib o'ting.",
      "Videoni sifat bo'yicha tekshiring: hook, izchillik, ovoz, ritm.",
      "Portfolio uchun qisqa tavsif (g'oya, jarayon, natija) yozing.",
    ],
    prompt: {
      title: "Capstone tekshiruv ro'yxati",
      text: "Quyidagi video uchun sifat tekshiruvini o'tkaz: [video tavsifi].\nHook kuchlimi? Izchillik saqlanganmi? Ovoz tabiiymi? Montaj ritmi yaxshimi? CTA aniqmi? Har biri bo'yicha ball va yaxshilash taklifini ber.",
    },
    task: {
      text: "To'liq bitta professional AI videoni yakunlab, portfolioga qo'ying.",
      checklist: [
        "Butun pipeline (g'oya → montaj) bajarildi.",
        "Video sifat tekshiruvidan o'tdi.",
        "Portfolio tavsifi yozildi.",
        "Video namoyishga tayyor.",
      ],
    },
  }),
};
