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
