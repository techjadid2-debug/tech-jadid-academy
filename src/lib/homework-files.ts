export const MAX_HOMEWORK_FILE_BYTES = 10 * 1024 * 1024;

export const HOMEWORK_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validHomeworkFileMeta(input: {
  size: number;
  contentType: string;
}): boolean {
  return (
    Number.isFinite(input.size) &&
    input.size > 0 &&
    input.size <= MAX_HOMEWORK_FILE_BYTES &&
    HOMEWORK_MIME_TYPES.has(input.contentType)
  );
}

export function normalizeHomeworkLink(value: string): string | null {
  const raw = value.trim().slice(0, 500);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
