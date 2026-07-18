import type { HomeworkSubmission } from "@/lib/types";
import { submitHomeworkAction } from "@/app/learn/homework-actions";

export function HomeworkPanel({
  slug,
  order,
  taskTitle,
  taskText,
  checklist,
  submission,
}: {
  slug: string;
  order: number;
  taskTitle: string;
  taskText: string;
  checklist: string[];
  submission: HomeworkSubmission | null;
}) {
  return (
    <section className="homework-panel" id="uy-vazifasi" style={{ marginTop: 28 }}>
      <span className="page-eyebrow">Uy vazifasi</span>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "6px 0 10px" }}>{taskTitle}</h2>
      <p className="hint" style={{ marginBottom: 12 }}>{taskText}</p>
      {checklist.length > 0 && (
        <ul style={{ margin: "0 0 18px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
          {checklist.map((c) => (
            <li key={c} className="hint">{c}</li>
          ))}
        </ul>
      )}

      {submission?.status === "reviewed" ? (
        <div className="panel" style={{ marginBottom: 18, background: "color-mix(in srgb, var(--green) 10%, var(--card-bg))" }}>
          <span className="badge badge-green" style={{ marginBottom: 10 }}>✓ Ustoz tasdiqladi</span>
          <div style={{ fontWeight: 700, fontSize: 22 }}>{submission.teacherScore}/100</div>
          {submission.teacherFeedback && <p style={{ marginTop: 8 }}>{submission.teacherFeedback}</p>}
        </div>
      ) : submission?.status === "ai_graded" ? (
        <div className="panel" style={{ marginBottom: 18, background: "color-mix(in srgb, var(--blue) 8%, var(--card-bg))" }}>
          <span className="badge badge-blue" style={{ marginBottom: 10 }}>AI dastlabki baho · ustoz ko&apos;rib chiqmoqda</span>
          <div style={{ fontWeight: 700, fontSize: 22 }}>{submission.aiScore}/100</div>
          {submission.aiFeedback && <p style={{ marginTop: 8 }}>{submission.aiFeedback}</p>}
        </div>
      ) : submission?.status === "submitted" ? (
        <div className="panel" style={{ marginBottom: 18 }}>
          <span className="badge badge-gray">Topshirildi · baholanmoqda</span>
        </div>
      ) : null}

      <form action={submitHomeworkAction} encType="multipart/form-data">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="order" value={order} />
        <div className="field">
          <label htmlFor="hw-text">Javobingiz</label>
          <textarea id="hw-text" name="text" rows={5} defaultValue={submission?.contentText ?? ""} placeholder="Bajargan ishingizni tavsiflab yozing..." />
        </div>
        <div className="field">
          <label htmlFor="hw-link">Havola (ixtiyoriy)</label>
          <input id="hw-link" name="link" type="url" defaultValue={submission?.linkUrl ?? ""} placeholder="https://..." />
        </div>
        <div className="field">
          <label htmlFor="hw-file">Fayl (ixtiyoriy — rasm, PDF yoki hujjat, 10MB gacha)</label>
          <input id="hw-file" name="file" type="file" accept="image/*,.pdf,.doc,.docx" />
          {submission?.fileName && <p className="hint" style={{ marginTop: 6 }}>Joriy fayl: {submission.fileName}</p>}
        </div>
        <button type="submit" className="btn btn-primary">
          {submission ? "Qayta topshirish" : "Topshirish"}
        </button>
      </form>
    </section>
  );
}
