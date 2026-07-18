import Image from "next/image";
import type { Lesson } from "@/lib/types";

type VisualKind = "map" | "value" | "layers" | "focus" | "compare" | "warning" | "flow" | "steps" | "prompt" | "result";

export interface InfographicSlide {
  label: string;
  title: string;
  body: string;
  tags: string[];
  kind: VisualKind;
  imageSrc?: string;
  instructorNote?: string;
  prompt?: string;
}

const lessonOneSlides: InfographicSlide[] = [
  {
    label: "01 · Asosiy tushuncha", title: "AI — ishdagi yordamchi", kind: "map", imageSrc: "/course/ai-asoslari/lesson-01/infographics/01.png",
    body: "Sun'iy intellekt matn, rasm va ma'lumot bilan ishlashda sizga tezkor birinchi variantni beradi. Yakuniy qaror esa insonniki.",
    tags: ["Siz berasiz", "AI tayyorlaydi", "Siz tekshirasiz"], instructorNote: "AI'ni odam o'rniga emas, yordamchi sifatida tasvirlang."
  },
  {
    label: "02 · Qatlamlar", title: "AI ichida nimalar bor?", kind: "layers", imageSrc: "/course/ai-asoslari/lesson-01/infographics/02.png",
    body: "Machine Learning — ma'lumotdan qonuniyat topadi. Deep Learning — murakkab naqshlarni o'rganadi. Generativ AI esa yangi matn, rasm yoki kod yaratadi.",
    tags: ["AI", "Machine Learning", "Generativ AI"], instructorNote: "Atamalarni yodlatmang: har biriga bitta sodda misol bering."
  },
  {
    label: "03 · Ishlash prinsipi", title: "AI javobni qanday tuzadi?", kind: "flow", imageSrc: "/course/ai-asoslari/lesson-01/infographics/03.png",
    body: "Model siz yozgan kontekstga qarab keyingi eng ehtimolli bo'lakni tanlaydi. Shu sababli aniq kontekst natijani ancha yaxshilaydi.",
    tags: ["Kontekst", "Ehtimol", "Javob"], instructorNote: "Bu yerda 'AI hamma narsani biladi' degan tasavvurni to'g'rilang."
  },
  {
    label: "04 · Foydali vazifalar", title: "AI qayerda vaqt tejaydi?", kind: "value", imageSrc: "/course/ai-asoslari/lesson-01/infographics/04.png",
    body: "Takrorlanadigan yozish, xulosa qilish, g'oya topish va ma'lumotni tartiblash ishlarida AI eng tez foyda beradi.",
    tags: ["Yozish", "Tahlil", "G'oya"], instructorNote: "Guruhdan aynan qaysi vazifaga haftasiga ko'p vaqt ketishini so'rang."
  },
  {
    label: "05 · Tekshiruv", title: "AI xato qilishi mumkin", kind: "warning", imageSrc: "/course/ai-asoslari/lesson-01/infographics/05.png",
    body: "Javob ishonchli ohangda yozilgan bo'lsa ham, fakt yoki manba noto'g'ri bo'lishi mumkin. Muhim ma'lumotni tekshirish shart.",
    tags: ["Taxmin", "Manba", "Tekshiruv"], instructorNote: "Bir haqiqiy xato misolini bering va tekshirish qadamini ko'rsating."
  },
  {
    label: "06 · Javobgarlik", title: "Oxirgi qaror kimda?", kind: "focus", imageSrc: "/course/ai-asoslari/lesson-01/infographics/06.png",
    body: "AI tavsiya beradi; mijozga yuborish, e'lon qilish yoki qaror qabul qilishdan oldin natijaga inson javob beradi.",
    tags: ["AI taklifi", "Inson nazorati", "Yakuniy natija"], instructorNote: "Mas'uliyatli qarorlarda AI javobini bevosita yubormaslik qoidasini ayting."
  },
  {
    label: "07 · Kuchli so'rov", title: "Prompt — aniq topshiriq", kind: "prompt", imageSrc: "/course/ai-asoslari/lesson-01/infographics/07.png",
    body: "Yaxshi prompt AI'ga kim ekanini, vaziyatni, nima qilishini va qanday formatda javob berishini aytadi.",
    tags: ["Rol", "Kontekst", "Vazifa"], instructorNote: "O'quvchilarning kasbidan kelib chiqib bitta promptni birga yig'ing."
  },
  {
    label: "08 · Taqqoslash", title: "Aniq prompt, aniq natija", kind: "compare", imageSrc: "/course/ai-asoslari/lesson-01/infographics/08.png",
    body: "'Post yoz' noaniq so'rov. Maqsad, auditoriya, ohang va format qo'shilsa, qayta ishlashga ketadigan vaqt kamayadi.",
    tags: ["Noaniq", "Tuzilgan", "Foydalanishga tayyor"], instructorNote: "Noaniq va aniq so'rovni ChatGPT'da solishtirib ko'rsating."
  },
  {
    label: "09 · Ish jarayoni", title: "AI bilan 4 qadamli workflow", kind: "steps", imageSrc: "/course/ai-asoslari/lesson-01/infographics/09.png",
    body: "Vazifani tanlang, AI'dan dastlabki variant oling, natijani tekshiring va o'zingizga moslab yakunlang. Shu jarayonni qayta ishlating.",
    tags: ["Vazifa", "Qoralama", "Tekshiruv"], instructorNote: "Uzun promptni ekranga chiqarmang: 4 qadamni ko'rsatib, promptni pastdagi shpargalkadan oling.",
    prompt: "Men [kasbingiz] bilan shug'ullanaman. Vazifam: [vazifangiz].\nMenga [auditoriya] uchun [format]da dastlabki variant tayyorla.\nNatijada nimalarni tekshirishim kerakligini ham yoz."
  },
  {
    label: "10 · Birinchi qadam", title: "Bugun bitta vazifani tanlang", kind: "result", imageSrc: "/course/ai-asoslari/lesson-01/infographics/10.png",
    body: "Har kuni yoki har hafta takrorlanadigan bitta ishni tanlang. Uni AI bilan tezlashtirib, foydali promptingizni saqlab qo'ying.",
    tags: ["1 vazifa", "1 prompt", "1 natija"], instructorNote: "Darsni amaliy vazifa bilan yakunlang: hamma o'zining birinchi workflowni yozsin."
  },
];

function blockText(lesson: Lesson, type: "paragraph" | "callout" | "steps" | "prompt" | "task") {
  const block = lesson.content?.find((item) => item.type === type);
  if (!block) return "";
  if (block.type === "callout") return block.text;
  if (block.type === "steps") return block.items.join(" → ");
  if (block.type === "task") return block.text;
  if (block.type === "paragraph" || block.type === "prompt") return block.text;
  return "";
}

export function getInfographicSlides(lesson: Lesson): InfographicSlide[] {
  if (lesson.order === 1) return lessonOneSlides;
  const theory = lesson.rows.find((row) => row.kind === "Nazariy")?.text ?? "Asosiy tushuncha";
  const practice = lesson.rows.find((row) => row.kind === "Amaliy")?.text ?? "Amaliy mashq";
  const outcome = lesson.rows.find((row) => row.kind === "Natija")?.text ?? "Tayyor natija";
  const overview = blockText(lesson, "paragraph") || theory;
  const point = blockText(lesson, "callout") || "Natijani tekshirib, o'z vazifangizga moslang.";
  const steps = blockText(lesson, "steps") || practice;
  const prompt = blockText(lesson, "prompt") || "Rol + kontekst + vazifa + format";
  const task = blockText(lesson, "task") || outcome;
  return [
    { label: "01 · Xarita", title: lesson.title, body: "Bugungi darsning yo'nalishi: tushuncha, amaliyot va ishdagi natija.", tags: ["Tushuncha", "Amaliyot", "Natija"], kind: "map" },
    { label: "02 · Qiymat", title: "Nega bu muhim?", body: overview, tags: ["Vaqt", "Sifat", "Nazorat"], kind: "value" },
    { label: "03 · Nazariya", title: "Asosiy poydevor", body: theory, tags: ["Kirish", "Jarayon", "Chiqish"], kind: "layers" },
    { label: "04 · Fokus", title: "Muhim qoida", body: point, tags: ["Aniqlik", "Tekshiruv", "Mas'uliyat"], kind: "focus" },
    { label: "05 · Taqqoslash", title: "Kuchli natija qanday chiqadi?", body: "Noaniq so'rov o'rniga aniq maqsad, kontekst va kutilgan format beriladi.", tags: ["Noaniq", "Aniq", "Tekshirilgan"], kind: "compare" },
    { label: "06 · Xato", title: "Nimadan saqlanamiz?", body: "Birinchi javobni yakuniy deb qabul qilmaymiz: natijani sinaymiz, tekshiramiz va yaxshilaymiz.", tags: ["Taxmin", "Tekshiruv", "Tuzatish"], kind: "warning" },
    { label: "07 · Workflow", title: "Birga bajariladigan oqim", body: practice, tags: ["Vazifa", "AI", "Natija"], kind: "flow" },
    { label: "08 · Qadamlar", title: "Amaliy tartib", body: steps, tags: ["1. Tanlang", "2. Sinang", "3. Saqlang"], kind: "steps" },
    { label: "09 · Shablon", title: "Qayta ishlatiladigan usul", body: prompt, tags: ["Rol", "Kontekst", "Format"], kind: "prompt" },
    { label: "10 · Yakun", title: "Darsdan olib chiqadigan natija", body: task, tags: ["Saqlash", "Qo'llash", "Keyingi qadam"], kind: "result" },
  ];
}

export function LessonInfographic({ slide, lessonTitle }: { slide: InfographicSlide; lessonTitle: string }) {
  return (
    <figure className={`knowledge-graphic knowledge-graphic-${slide.kind}${slide.imageSrc ? " has-art" : ""}`} aria-label={`${lessonTitle}: ${slide.title}`}>
      {slide.imageSrc ? <Image src={slide.imageSrc} alt="" fill sizes="(max-width: 640px) 100vw, 44vw" className="knowledge-art" priority /> : <>
        <div className="knowledge-grid" aria-hidden="true" />
        <div className="knowledge-orbit orbit-one" aria-hidden="true" /><div className="knowledge-orbit orbit-two" aria-hidden="true" />
        <div className="knowledge-center"><span>{slide.kind === "warning" ? "!" : "AI"}</span></div>
      </>}
      <div className="knowledge-tags">{slide.tags.map((tag, index) => <span key={tag} className={`knowledge-tag tag-${index + 1}`}>{tag}</span>)}</div>
      <figcaption><span>{slide.label}</span><strong>{slide.title}</strong></figcaption>
    </figure>
  );
}
