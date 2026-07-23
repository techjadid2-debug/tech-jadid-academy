import type { LessonContentBlock, ToolPick } from "../types";

// Har bir dars — 120 daqiqalik project lab (foydalanuvchi belgilagan format).
const LAB_PLAN: string[] = [
  "15 daqiqa — kerakli nazariya va bugungi aniq maqsad.",
  "25 daqiqa — ustoz bilan live build: ekranda birga quramiz.",
  "65 daqiqa — o'quvchi o'z loyihasini quradi (ustoz yordamida).",
  "15 daqiqa — debugging va code review: xatolarni topib, natijani baholaymiz.",
];

export interface LabOptions {
  /** Dars maqsadi — 2-3 gap */
  overview: string;
  /** Eng muhim qoida yoki nuqta */
  keyPoint: string;
  /** Amaliy bosqichlar (o'quvchi qiladigan ish) */
  steps: string[];
  /** Free→Pro vosita tavsiyasi (ixtiyoriy) */
  tools?: { title?: string; items: ToolPick[] };
  /** Tayyor, qayta ishlatiladigan prompt */
  prompt: { title: string; text: string };
  /** Dars yakuni topshirig'i + checklist */
  task: { text: string; checklist: string[] };
}

/** 120 daqiqalik project lab strukturasidagi to'liq dars materialini quradi. */
export function labLesson(opts: LabOptions): LessonContentBlock[] {
  const blocks: LessonContentBlock[] = [
    { type: "heading", text: "Dars maqsadi" },
    { type: "paragraph", text: opts.overview },
    { type: "callout", title: "Muhim nuqta", text: opts.keyPoint },
    { type: "heading", text: "120 daqiqalik project lab" },
    { type: "steps", title: "Bugungi lab jarayoni", items: LAB_PLAN },
    { type: "heading", text: "Amaliy qadamlar" },
    { type: "steps", title: "Bosqichma-bosqich", items: opts.steps },
  ];
  if (opts.tools) {
    blocks.push({ type: "tools", title: opts.tools.title ?? "Kerakli vositalar — avval bepul, keyin Pro", items: opts.tools.items });
  }
  blocks.push({ type: "prompt", title: opts.prompt.title, text: opts.prompt.text });
  blocks.push({ type: "task", title: "Dars yakuni", text: opts.task.text, checklist: opts.task.checklist });
  return blocks;
}
