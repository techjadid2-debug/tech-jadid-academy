import type { LessonContentBlock, ToolPick } from "@/lib/types";

const text = (value: unknown, max = 20_000): value is string =>
  typeof value === "string" && value.length <= max;

const stringList = (value: unknown, maxItems = 50): value is string[] =>
  Array.isArray(value) &&
  value.length <= maxItems &&
  value.every((item) => text(item, 2_000));

function isTool(value: unknown): value is ToolPick {
  if (!value || typeof value !== "object") return false;
  const tool = value as Partial<ToolPick>;
  return (
    text(tool.name, 200) &&
    text(tool.free, 2_000) &&
    text(tool.pro, 2_000) &&
    (tool.note === undefined || text(tool.note, 2_000))
  );
}

export function isLessonContentBlock(value: unknown): value is LessonContentBlock {
  if (!value || typeof value !== "object") return false;
  const block = value as Record<string, unknown>;
  switch (block.type) {
    case "paragraph":
    case "heading":
      return text(block.text);
    case "image":
      return (
        text(block.src, 1_000) &&
        block.src.startsWith("/") &&
        text(block.alt, 500) &&
        (block.caption === undefined || text(block.caption, 1_000))
      );
    case "callout":
    case "prompt":
      return text(block.title, 500) && text(block.text);
    case "steps":
      return text(block.title, 500) && stringList(block.items);
    case "task":
      return (
        text(block.title, 500) &&
        text(block.text) &&
        stringList(block.checklist)
      );
    case "tools":
      return (
        text(block.title, 500) &&
        Array.isArray(block.items) &&
        block.items.length <= 30 &&
        block.items.every(isTool)
      );
    default:
      return false;
  }
}

export function parseLessonContent(raw: string): LessonContentBlock[] | null {
  if (raw.length > 100_000) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) &&
      value.length <= 200 &&
      value.every(isLessonContentBlock)
      ? value
      : null;
  } catch {
    return null;
  }
}
