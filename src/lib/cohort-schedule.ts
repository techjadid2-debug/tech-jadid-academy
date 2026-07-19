export interface ScheduleLessonInput { id: string; order: number; title: string }

export interface GeneratedScheduleRow {
  lesson: ScheduleLessonInput;
  sessionStarts: Date;
  sessionEnds: Date;
  releaseAt: Date;
  dueAt: Date;
}

/** 8 hafta davomida haftasiga ikki dars: 1-kun va 4-kun. */
export function buildCohortSchedule(firstSession: Date, lessons: ScheduleLessonInput[]): GeneratedScheduleRow[] {
  if (!Number.isFinite(firstSession.getTime())) throw new Error("Invalid first session date");
  return [...lessons].sort((a, b) => a.order - b.order).map((lesson) => {
    const week = Math.floor((lesson.order - 1) / 2);
    const secondLessonOffset = lesson.order % 2 === 0 ? 3 : 0;
    const sessionStarts = new Date(firstSession.getTime() + (week * 7 + secondLessonOffset) * 24 * 60 * 60 * 1000);
    return {
      lesson,
      sessionStarts,
      sessionEnds: new Date(sessionStarts.getTime() + 90 * 60 * 1000),
      releaseAt: new Date(sessionStarts.getTime() - 24 * 60 * 60 * 1000),
      dueAt: new Date(sessionStarts.getTime() + 6 * 24 * 60 * 60 * 1000),
    };
  });
}
