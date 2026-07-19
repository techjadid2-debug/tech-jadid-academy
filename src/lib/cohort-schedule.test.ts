import assert from "node:assert/strict";
import test from "node:test";
import { buildCohortSchedule } from "./cohort-schedule";

test("16 darsni 8 haftaga, haftasiga ikki martadan joylaydi", () => {
  const start = new Date("2026-08-03T14:00:00.000Z");
  const lessons = Array.from({ length: 16 }, (_, index) => ({ id: String(index + 1), order: index + 1, title: `Dars ${index + 1}` }));
  const schedule = buildCohortSchedule(start, lessons);
  assert.equal(schedule.length, 16);
  assert.equal(schedule[0].sessionStarts.toISOString(), "2026-08-03T14:00:00.000Z");
  assert.equal(schedule[1].sessionStarts.toISOString(), "2026-08-06T14:00:00.000Z");
  assert.equal(schedule[2].sessionStarts.toISOString(), "2026-08-10T14:00:00.000Z");
  assert.equal(schedule[15].sessionStarts.toISOString(), "2026-09-24T14:00:00.000Z");
});

test("material 24 soat oldin ochiladi, dars 90 daqiqa va deadline 6 kun", () => {
  const [row] = buildCohortSchedule(new Date("2026-08-03T14:00:00.000Z"), [{ id: "1", order: 1, title: "AI" }]);
  assert.equal(row.releaseAt.toISOString(), "2026-08-02T14:00:00.000Z");
  assert.equal(row.sessionEnds.toISOString(), "2026-08-03T15:30:00.000Z");
  assert.equal(row.dueAt.toISOString(), "2026-08-09T14:00:00.000Z");
});
