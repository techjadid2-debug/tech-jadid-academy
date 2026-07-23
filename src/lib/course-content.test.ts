import assert from "node:assert/strict";
import test from "node:test";
import { allLessons, getCourse } from "./course-data";

const COURSE_SHAPES = [
  { slug: "ai-video-creator", modules: 4, lessons: 16 },
  { slug: "ai-builder", modules: 6, lessons: 16 },
] as const;

for (const shape of COURSE_SHAPES) {
  test(`${shape.slug} — ${shape.modules} modul va ${shape.lessons} to'liq dars paketidan iborat`, () => {
    const course = getCourse(shape.slug);
    assert.ok(course, `${shape.slug} topilmadi`);
    assert.equal(course.modules.length, shape.modules);
    const lessons = allLessons(course);
    assert.equal(lessons.length, shape.lessons);
    assert.deepEqual(
      lessons.map((lesson) => lesson.order),
      Array.from({ length: shape.lessons }, (_, index) => index + 1),
    );
    // Birinchi dars bepul preview.
    assert.equal(lessons[0].isPreview, true, `${shape.slug} 1-darsi preview bo'lishi kerak`);

    let toolsLessons = 0;
    for (const lesson of lessons) {
      assert.equal(lesson.rows.length, 3, `${shape.slug} ${lesson.order}-darsning Nazariy/Amaliy/Natija qatori to'liq emas`);
      assert.ok((lesson.content?.length ?? 0) >= 8, `${shape.slug} ${lesson.order}-dars kontent paketi to'liq emas`);
      assert.ok(lesson.content?.some((block) => block.type === "task"), `${shape.slug} ${lesson.order}-darsda vazifa yo'q`);
      if (lesson.content?.some((block) => block.type === "tools")) toolsLessons += 1;
    }
    // Free→Pro tool tavsiyasi ko'p darslarda mavjud bo'lishi kerak.
    assert.ok(toolsLessons >= 10, `${shape.slug}: Free→Pro tool bloki yetarli darslarda yo'q (${toolsLessons})`);
  });
}

test("Eski ai-asoslari kursi endi katalogda yo'q", () => {
  assert.equal(getCourse("ai-asoslari"), undefined);
});

test("AI sandbox faqat mos darslarda yoqilgan", () => {
  const creator = getCourse("ai-video-creator");
  const builder = getCourse("ai-builder");
  assert.ok(creator && builder);
  assert.deepEqual(
    allLessons(creator).filter((l) => l.sandboxEnabled).map((l) => l.order),
    [2, 3, 6],
  );
  assert.deepEqual(
    allLessons(builder).filter((l) => l.sandboxEnabled).map((l) => l.order),
    [1, 2, 7, 12, 13, 14],
  );
});
