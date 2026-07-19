"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { HomeworkSubmission } from "@/lib/types";
import { submitHomeworkAction } from "@/app/learn/homework-actions";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export function HomeworkPanel({ slug, order, taskTitle, taskText, checklist, submission }: {
  slug: string; order: number; taskTitle: string; taskText: string; checklist: string[]; submission: HomeworkSubmission | null;
}) {
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading || pending) return;
    setError(null);
    const formData = new FormData(event.currentTarget);
    const entry = formData.get("file");
    const file = entry instanceof File && entry.size > 0 ? entry : null;
    formData.delete("file");

    if (file) {
      setUploading(true);
      try {
        const response = await fetch("/api/homework/upload-url", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug, order, fileName: file.name, contentType: file.type, size: file.size }),
        });
        const payload = await response.json() as { path?: string; token?: string; error?: string };
        if (!response.ok || !payload.path || !payload.token) throw new Error(payload.error ?? "Fayl yuklanmadi.");
        const supabase = createSupabaseBrowser();
        if (!supabase) throw new Error("Storage ulanmagan.");
        const { error: uploadError } = await supabase.storage.from("homework").uploadToSignedUrl(payload.path, payload.token, file, { contentType: file.type });
        if (uploadError) throw new Error("Faylni Storage'ga yuklab bo'lmadi.");
        formData.set("filePath", payload.path);
        formData.set("fileName", file.name);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Fayl yuklanmadi.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    startTransition(() => { void submitHomeworkAction(formData); });
  }

  return (
    <section className="homework-panel" id="uy-vazifasi" style={{ marginTop: 28 }}>
      <span className="page-eyebrow">Uy vazifasi</span>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "6px 0 10px" }}>{taskTitle}</h2>
      <p className="hint" style={{ marginBottom: 12 }}>{taskText}</p>
      {checklist.length > 0 && <ul style={{ margin: "0 0 18px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>{checklist.map((item) => <li key={item} className="hint">{item}</li>)}</ul>}

      {submission?.status === "reviewed" ? (
        <div className="panel" style={{ marginBottom: 18, background: "color-mix(in srgb, var(--green) 10%, var(--card-bg))" }}><span className="badge badge-green" style={{ marginBottom: 10 }}>✓ Ustoz tasdiqladi</span><div style={{ fontWeight: 700, fontSize: 22 }}>{submission.teacherScore}/100</div>{submission.teacherFeedback && <p style={{ marginTop: 8 }}>{submission.teacherFeedback}</p>}</div>
      ) : submission?.status === "ai_graded" ? (
        <div className="panel" style={{ marginBottom: 18, background: "color-mix(in srgb, var(--blue) 8%, var(--card-bg))" }}><span className="badge badge-blue" style={{ marginBottom: 10 }}>AI dastlabki baho · ustoz ko&apos;rib chiqmoqda</span><div style={{ fontWeight: 700, fontSize: 22 }}>{submission.aiScore}/100</div>{submission.aiFeedback && <p style={{ marginTop: 8 }}>{submission.aiFeedback}</p>}</div>
      ) : submission?.status === "submitted" ? <div className="panel" style={{ marginBottom: 18 }}><span className="badge badge-gray">Topshirildi · ustoz ko&apos;rib chiqadi</span></div> : null}

      <form onSubmit={submit} encType="multipart/form-data">
        <input type="hidden" name="slug" value={slug} /><input type="hidden" name="order" value={order} />
        <div className="field"><label htmlFor="hw-text">Javobingiz</label><textarea id="hw-text" name="text" rows={5} defaultValue={submission?.contentText ?? ""} placeholder="Bajargan ishingizni tavsiflab yozing..." /></div>
        <div className="field"><label htmlFor="hw-link">Havola (ixtiyoriy)</label><input id="hw-link" name="link" type="url" defaultValue={submission?.linkUrl ?? ""} placeholder="https://..." /></div>
        <div className="field"><label htmlFor="hw-file">Fayl (ixtiyoriy — JPG, PNG, WebP, PDF yoki Word, 10MB gacha)</label><input id="hw-file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx" />{submission?.fileName && <p className="hint" style={{ marginTop: 6 }}>Joriy fayl: {submission.fileName}</p>}</div>
        {error && <p role="alert" className="hint" style={{ color: "var(--red)", marginBottom: 10 }}>⚠️ {error}</p>}
        <button type="submit" className="btn btn-primary" disabled={uploading || pending}>{uploading ? "Fayl yuklanmoqda…" : pending ? "Topshirilmoqda…" : submission ? "Qayta topshirish" : "Topshirish"}</button>
      </form>
    </section>
  );
}
