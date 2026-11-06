import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessLesson } from "@/lib/access";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getLessonId } from "@/lib/supabase/db";
import {
  HOMEWORK_MIME_TYPES,
  MAX_HOMEWORK_FILE_BYTES,
  validHomeworkFileMeta,
} from "@/lib/homework-files";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Kirish talab qilinadi." }, { status: 401 });
  let body: { slug?: string; order?: number; fileName?: string; contentType?: string; size?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Noto'g'ri so'rov." }, { status: 400 });
  }
  const slug = String(body.slug ?? "");
  const order = Number(body.order ?? 0);
  const fileName = String(body.fileName ?? "").slice(0, 180);
  const contentType = String(body.contentType ?? "");
  const size = Number(body.size ?? 0);
  if (!slug || !Number.isInteger(order) || !fileName || !validHomeworkFileMeta({ size, contentType })) {
    return NextResponse.json({ error: "Fayl turi yoki hajmi ruxsat etilmagan." }, { status: 400 });
  }
  if (!(await canAccessLesson(user.id, slug, order))) {
    return NextResponse.json({ error: "Darsga kirish yo'q." }, { status: 403 });
  }
  const admin = createSupabaseAdmin();
  const lessonId = await getLessonId(slug, order);
  if (!admin || !lessonId) return NextResponse.json({ error: "Storage tayyor emas." }, { status: 503 });
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${lessonId}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safeName}`;
  const { data, error } = await admin.storage.from("homework").createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[homework-upload] signed URL failed", error);
    return NextResponse.json({ error: "Yuklash manzilini yaratib bo'lmadi." }, { status: 503 });
  }
  return NextResponse.json({
    path,
    token: data.token,
    maxBytes: MAX_HOMEWORK_FILE_BYTES,
    allowedTypes: [...HOMEWORK_MIME_TYPES],
  });
}
