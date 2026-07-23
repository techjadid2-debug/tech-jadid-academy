import type { Course, LessonContentBlock } from "./types";
import { VIDEO_CREATOR_MATERIALS } from "./content/ai-video-creator";
import { BUILDER_MATERIALS } from "./content/ai-builder";

// ============================================================================
// Har kursning boy dars materiallari (content bloklari) slug bo'yicha saqlanadi.
// `withLessonMaterials` kurs obyektiga tegishli materialni order bo'yicha biriktiradi.
// Dars obyektida inline `content` bo'lsa — u ustuvor bo'ladi.
// ============================================================================

const MATERIALS_BY_SLUG: Record<string, Record<number, LessonContentBlock[]>> = {
  "ai-video-creator": VIDEO_CREATOR_MATERIALS,
  "ai-builder": BUILDER_MATERIALS,
};

export function withLessonMaterials(course: Course): Course {
  const materials = MATERIALS_BY_SLUG[course.slug] ?? {};
  return {
    ...course,
    modules: course.modules.map((module) => ({
      ...module,
      lessons: module.lessons.map((lesson) => ({
        ...lesson,
        content: lesson.content?.length ? lesson.content : materials[lesson.order] ?? [],
      })),
    })),
  };
}
