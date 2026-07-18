export interface LessonReview {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Har jonli dars yakunida keyingi mavzuga o'tishdan oldin beriladigan tezkor test.
export const LESSON_REVIEWS: Record<number, LessonReview> = {
  1: { question: "AI javobidan foydalanganda yakuniy mas'uliyat kimda qoladi?", options: ["AI modelida", "Foydalanuvchida", "Internetda"], correctIndex: 1, explanation: "AI yordamchi; faktni tekshirish va qaror qabul qilish inson vazifasi." },
  2: { question: "LLM javobini muhim ishda nima uchun tekshirish kerak?", options: ["U faqat inglizcha ishlaydi", "U ishonch bilan xato qilishi mumkin", "U rasm yaratmaydi"], correctIndex: 1, explanation: "Model ehtimoliy javob yaratadi, shuning uchun fakt va manbani tekshirish zarur." },
  3: { question: "Model tanlashning eng to'g'ri usuli qaysi?", options: ["Eng mashhurini tanlash", "O'z real vazifangizda sinab solishtirish", "Eng qimmatini olish"], correctIndex: 1, explanation: "Sifat, tezlik va narx aynan sizning vazifangizda baholanadi." },
  4: { question: "Kuchli promptning muhim qismi qaysi?", options: ["Faqat uzun yozish", "Rol, kontekst, vazifa va format", "Faqat emoji ishlatish"], correctIndex: 1, explanation: "Aniq kontekst va kutilgan format natijani boshqaradi." },
  5: { question: "Murakkab vazifada qaysi yondashuv foydali?", options: ["Hammasini bitta noaniq so'rovda so'rash", "Vazifani tekshiriladigan bosqichlarga bo'lish", "Natijani tekshirmaslik"], correctIndex: 1, explanation: "Bosqichlar sifatni nazorat qilishni osonlashtiradi." },
  6: { question: "Workflow nimani anglatadi?", options: ["Bir marta ishlatiladigan tasodifiy prompt", "Takrorlanuvchi ish uchun saqlangan qadamlar", "Faqat dasturchilar ishlatadigan kod"], correctIndex: 1, explanation: "Yaxshi workflow kirish, prompt, tekshiruv va natijani takrorlaydi." },
  7: { question: "Rasm promptini yaxshilashning eng foydali yo'li qaysi?", options: ["Hammasini birdan o'zgartirish", "Bitta parametrni o'zgartirib iteratsiya qilish", "Natijani ko'rmaslik"], correctIndex: 1, explanation: "Kichik o'zgarishlar qaysi detal natijaga ta'sir qilganini ko'rsatadi." },
  8: { question: "Vizual seriyada izchillik uchun nima kerak?", options: ["Har rasmda boshqa uslub", "Reference va o'zgarmas belgilar", "Faqat tasodif"], correctIndex: 1, explanation: "Reference, rang va asosiy tavsif personaj yoki brendni bir xil tutadi." },
  9: { question: "Qisqa AI video pipeline'i nimadan boshlanadi?", options: ["Montajdan", "Ssenariy va kadrlar rejasidan", "Reklama berishdan"], correctIndex: 1, explanation: "Aniq hikoya keyingi tasvir, ovoz va montajni tezlashtiradi." },
  10: { question: "Vibe codingda AI'ga nimani aniq berish kerak?", options: ["Faqat 'app qil' degan gapni", "Muammo, foydalanuvchi va asosiy harakatni", "Parolingizni"], correctIndex: 1, explanation: "Aniq mahsulot tavsifi ishlaydigan boshlang'ich versiya beradi." },
  11: { question: "Deploydan oldingi muhim qadam qaysi?", options: ["Asosiy foydalanuvchi oqimini sinash", "Logo rangini cheksiz almashtirish", "Hech kimga ko'rsatmaslik"], correctIndex: 0, explanation: "Foydalanuvchi kabi sinab ko'rish xatolarni erta topadi." },
  12: { question: "AI funksiyasi qachon foydali hisoblanadi?", options: ["Faqat nomida AI bo'lsa", "Aniq foydalanuvchi muammosini hal qilsa", "Juda uzun javob bersa"], correctIndex: 1, explanation: "AI mahsulot ichida aniq qiymat yaratishi kerak." },
  13: { question: "Agentga ko'proq ruxsat berilganda nima oshadi?", options: ["Tekshiruv va xavfsizlik ehtiyoji", "Internet tezligi", "Rasm sifati"], correctIndex: 0, explanation: "Ruxsatlar kengaysa, inson tasdig'i va chegaralar zarur." },
  14: { question: "Yaxshi birinchi Telegram bot qanday boshlanadi?", options: ["O'nlab chalkash buyruqlardan", "Bitta foydali vazifani yaxshi bajarishdan", "Faqat stikerlardan"], correctIndex: 1, explanation: "Oddiy, ishonchli bitta oqim keyin kengaytirishga tayanch bo'ladi." },
  15: { question: "Kasbda AI joriy qilishni nimadan boshlash ma'qul?", options: ["Hamma ishni birdan avtomatlashtirishdan", "Eng ko'p vaqt oladigan kichik qadamdan", "Ish jarayonini bilmaslikdan"], correctIndex: 1, explanation: "Kichik, o'lchanadigan o'zgarish tez natija beradi." },
  16: { question: "Portfolio nimani ko'rsatishi kerak?", options: ["Faqat chiroyli rasmni", "Muammo, yechim va natijani", "Faqat sertifikatni"], correctIndex: 1, explanation: "Mijoz yoki ish beruvchi siz yaratgan qiymatni shundan tushunadi." },
};
