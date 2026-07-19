import assert from "node:assert/strict";
import test from "node:test";
import { allLessons, getCourse } from "./course-data";

test("AI kursi 6 modul va 16 to'liq dars paketidan iborat", () => {
  const course = getCourse("ai-asoslari");
  assert.ok(course);
  assert.equal(course.modules.length, 6);
  const lessons = allLessons(course);
  assert.equal(lessons.length, 16);
  assert.deepEqual(lessons.map((lesson) => lesson.order), Array.from({ length: 16 }, (_, index) => index + 1));
  for (const lesson of lessons) {
    assert.equal(lesson.rows.length, 3, `${lesson.order}-darsning Nazariy/Amaliy/Natija qatori to'liq emas`);
    assert.ok((lesson.content?.length ?? 0) >= 8, `${lesson.order}-dars kontent paketi to'liq emas`);
    assert.ok(lesson.content?.some((block) => block.type === "task"), `${lesson.order}-darsda vazifa yo'q`);
  }
});

test("AI yordamchi faqat xarajat nazorati rejalangan darslarda yoqilgan", () => {
  const course = getCourse("ai-asoslari");
  assert.ok(course);
  const enabled = allLessons(course).filter((lesson) => lesson.sandboxEnabled).map((lesson) => lesson.order);
  assert.deepEqual(enabled, [4, 5, 6, 10, 11, 12, 13, 14]);
});
