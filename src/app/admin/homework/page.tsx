import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth";
import { AI_FOUNDATIONS } from "@/lib/course-data";
import { listSubmissionsForReview, getHomeworkFileUrl, type ReviewQueueItem } from "@/lib/homework";
import { reviewHomeworkSubmission } from "../actions";
import { isTeacher } from "@/lib/cohorts";

export default async function AdminHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/homework");
  if (!isTeacher(user)) redirect("/dashboard");

  const submissions = await listSubmissionsForReview(AI_FOUNDATIONS.slug, user);
  const pending = submissions.filter((s) => s.status === "submitted" || s.status === "ai_graded");
  const reviewed = submissions.filter((s) => s.status === "reviewed");

  return (
    <>
      <SiteNav links={[]} cta={{ href: user.role === "admin" ? "/admin" : "/teacher", label: user.role === "admin" ? "Admin panel" : "Ustoz kabineti" }} />
      <main className="shell">
        <div className="page-eyebrow">Admin panel</div>
        <h1 className="page-title">Uy vazifalarini baholash</h1>
        <p className="page-sub">
          AI dastlabki baho beradi; siz ko&apos;rib chiqib bahoni tahrirlab tasdiqlaysiz. Tasdiqlangach
          o&apos;quvchi &quot;ustoz tasdig&apos;i&quot; belgisini ko&apos;radi.
        </p>

        {saved && (
          <div className="panel" style={{ marginBottom: 16, background: "color-mix(in srgb, var(--green) 10%, var(--card-bg))" }}>
            ✓ Saqlandi.
          </div>
        )}
        {error && (
          <div className="panel" style={{ marginBottom: 16, background: "color-mix(in srgb, var(--red) 10%, var(--card-bg))" }}>
            ⚠️ Saqlashda xatolik yuz berdi.
          </div>
        )}

        <div className="panel" style={{ marginBottom: 16 }}>
          <b>Ko&apos;rib chiqilishi kerak {pending.length > 0 && `(${pending.length})`}</b>
          {pending.length === 0 ? (
            <p className="hint" style={{ marginTop: 10 }}>Hozircha tekshirishni kutayotgan topshiriq yo&apos;q.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              {await Promise.all(pending.map((s) => renderSubmission(s)))}
            </div>
          )}
        </div>

        {reviewed.length > 0 && (
          <div className="panel">
            <b>Tasdiqlangan ({reviewed.length})</b>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
              {await Promise.all(reviewed.map((s) => renderSubmission(s)))}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

async function renderSubmission(s: ReviewQueueItem) {
  const fileUrl = s.filePath ? await getHomeworkFileUrl(s.filePath) : null;
  return (
    <details key={s.id} id={`hw-${s.id}`} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: "12px 16px" }} open={s.status === "ai_graded"}>
      <summary style={{ cursor: "pointer", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600 }}>{s.studentName ?? "Noma'lum"} {s.studentLogin && <span className="hint">@{s.studentLogin}</span>}</span>
        <span className="hint">Dars {String(s.lessonOrder).padStart(2, "0")} · {s.lessonTitle}</span>
        <span className={`badge ${s.status === "reviewed" ? "badge-green" : "badge-blue"}`}>
          {s.status === "reviewed" ? `✓ ${s.teacherScore}/100` : s.aiScore === null ? "Ustoz kutilyapti" : `AI: ${s.aiScore}/100`}
        </span>
      </summary>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {s.contentText && (
          <div>
            <div className="hint" style={{ marginBottom: 4 }}>Javob</div>
            <p style={{ whiteSpace: "pre-wrap" }}>{s.contentText}</p>
          </div>
        )}
        {s.linkUrl && (
          <div>
            <div className="hint" style={{ marginBottom: 4 }}>Havola</div>
            <a href={s.linkUrl} target="_blank" rel="noreferrer">{s.linkUrl}</a>
          </div>
        )}
        {fileUrl && (
          <div>
            <div className="hint" style={{ marginBottom: 4 }}>Fayl</div>
            <a href={fileUrl} target="_blank" rel="noreferrer">{s.fileName ?? "Faylni ko'rish"}</a>
          </div>
        )}
        {s.aiFeedback && (
          <div>
            <div className="hint" style={{ marginBottom: 4 }}>AI izohi ({s.aiScore}/100)</div>
            <p>{s.aiFeedback}</p>
          </div>
        )}

        <form action={reviewHomeworkSubmission} style={{ borderTop: "1px solid var(--line)", marginTop: 8, paddingTop: 12, display: "grid", gap: 10 }}>
          <input type="hidden" name="submissionId" value={s.id} />
          <div className="field" style={{ marginBottom: 0, maxWidth: 160 }}>
            <label>Ustoz bahosi (0-100)</label>
            <input name="score" type="number" min={0} max={100} defaultValue={s.teacherScore ?? s.aiScore ?? 0} required />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Ustoz izohi</label>
            <textarea name="feedback" rows={3} defaultValue={s.teacherFeedback ?? s.aiFeedback ?? ""} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifySelf: "start", padding: "8px 16px", fontSize: 13 }}>
            {s.status === "reviewed" ? "Bahoni yangilash" : "Tasdiqlash"}
          </button>
        </form>
      </div>
    </details>
  );
}
