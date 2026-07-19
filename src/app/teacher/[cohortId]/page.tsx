import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { getCurrentUser } from "@/lib/auth";
import { getCohortWorkspace, isTeacher } from "@/lib/cohorts";
import { addInstructorToCohort, markAttendance, publishAnnouncement, updateCohortLesson, updateCohortStatus } from "../actions";

export default async function CohortPage({
  params,
  searchParams,
}: {
  params: Promise<{ cohortId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [{ cohortId }, sp, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  if (!user) redirect(`/login?next=${encodeURIComponent(`/teacher/${cohortId}`)}`);
  if (!isTeacher(user)) redirect("/dashboard");
  const workspace = await getCohortWorkspace(user, cohortId);
  if (!workspace) notFound();
  const { cohort, lessons, announcements, members } = workspace;
  const students = members.filter((member) => member.role === "student");
  const instructors = members.filter((member) => member.role === "instructor");
  const latestSession = [...lessons].filter((lesson) => lesson.sessionId).sort((a, b) => (b.sessionStartsAt ?? "").localeCompare(a.sessionStartsAt ?? ""))[0];

  return (
    <>
      <SiteNav links={[]} cta={{ href: "/teacher", label: "Guruhlar" }} />
      <main className="shell">
        <Link href="/teacher" className="hint">← Barcha guruhlar</Link>
        <div className="teacher-heading" style={{ marginTop: 12 }}>
          <div><div className="page-eyebrow">Jonli guruh</div><h1 className="page-title">{cohort.title}</h1><p className="page-sub">{formatDisplay(cohort.startsAt)} — {formatDisplay(cohort.endsAt)} · {students.length} o&apos;quvchi</p></div>
          <form action={updateCohortStatus} className="teacher-status-form">
            <input type="hidden" name="cohortId" value={cohort.id} />
            <select name="status" defaultValue={cohort.status}><option value="draft">Draft</option><option value="open">Qabul ochiq</option><option value="active">Faol</option><option value="completed">Yakunlangan</option></select>
            <button className="btn btn-ghost">Holatni saqlash</button>
          </form>
        </div>
        {sp.saved && <div className="panel teacher-notice">✓ Saqlandi.</div>}
        {sp.error && <div className="panel teacher-notice teacher-notice-error">⚠️ Saqlashda xatolik. Maydonlarni tekshiring.</div>}

        <section className="teacher-overview-grid">
          <div className="panel"><span className="hint">O&apos;quvchilar</span><strong>{students.length}</strong></div>
          <div className="panel"><span className="hint">Jadval</span><strong>{lessons.length}/16</strong></div>
          <div className="panel"><span className="hint">Keyingi dars</span><strong>{lessons.find((lesson) => lesson.sessionStartsAt && new Date(lesson.sessionStartsAt) > new Date())?.order ?? "—"}</strong></div>
        </section>

        <section className="panel" id="instructors" style={{ marginTop: 24 }}>
          <b>Guruh ustozlari</b>
          <p className="hint" style={{ marginTop: 6 }}>{instructors.map((instructor) => instructor.fullName).join(", ") || "Ustoz biriktirilmagan"}</p>
          <form action={addInstructorToCohort} className="teacher-payment-form" style={{ marginTop: 12 }}>
            <input type="hidden" name="cohortId" value={cohort.id} />
            <input name="login" placeholder="ustoz login" required />
            <button className="btn btn-ghost">Ustozni biriktirish</button>
          </form>
        </section>

        <section className="panel" id="announcements" style={{ marginTop: 24 }}>
          <b>E&apos;lonlar</b>
          <form action={publishAnnouncement} className="teacher-announcement-form">
            <input type="hidden" name="cohortId" value={cohort.id} />
            <div className="field"><label>Sarlavha</label><input name="title" required maxLength={140} /></div>
            <div className="field"><label>Xabar</label><textarea name="body" rows={3} required maxLength={4000} /></div>
            <button className="btn btn-primary">E&apos;lon qilish</button>
          </form>
          {announcements.map((announcement) => <article className="teacher-announcement" key={announcement.id}><b>{announcement.title}</b><p>{announcement.body}</p><span className="hint">{formatDisplay(announcement.publishedAt)}</span></article>)}
        </section>

        <section style={{ marginTop: 28 }}>
          <div className="page-eyebrow">16 darslik jadval</div>
          <div className="teacher-lessons">
            {lessons.map((lesson) => (
              <details className="panel" id={`lesson-${lesson.lessonId}`} key={lesson.lessonId}>
                <summary><b>{String(lesson.order).padStart(2, "0")} · {lesson.title}</b><span className="hint">{lesson.sessionStartsAt ? formatDisplay(lesson.sessionStartsAt) : "vaqt belgilanmagan"}</span></summary>
                <form action={updateCohortLesson} className="teacher-lesson-form">
                  <input type="hidden" name="cohortId" value={cohort.id} /><input type="hidden" name="lessonId" value={lesson.lessonId} />
                  <div className="field"><label>Material ochilishi</label><input name="releaseAt" type="datetime-local" defaultValue={toDateTimeLocal(lesson.releaseAt)} required /></div>
                  <div className="field"><label>Topshiriq muddati</label><input name="dueAt" type="datetime-local" defaultValue={lesson.dueAt ? toDateTimeLocal(lesson.dueAt) : ""} /></div>
                  <div className="field"><label>Jonli dars vaqti</label><input name="sessionStartsAt" type="datetime-local" defaultValue={lesson.sessionStartsAt ? toDateTimeLocal(lesson.sessionStartsAt) : ""} required /></div>
                  <div className="field"><label>Google Meet</label><input name="meetUrl" type="url" defaultValue={lesson.meetUrl ?? ""} placeholder="https://meet.google.com/..." /></div>
                  <div className="field"><label>YouTube video ID</label><input name="youtubeId" defaultValue={lesson.youtubeId ?? ""} placeholder="dQw4w9WgXcQ" /></div>
                  <button className="btn btn-primary">Darsni saqlash</button>
                </form>
              </details>
            ))}
          </div>
        </section>

        <section className="panel" id="students" style={{ marginTop: 28 }}>
          <b>O&apos;quvchilar va davomat</b>
          {students.length === 0 ? <p className="hint" style={{ marginTop: 10 }}>To&apos;lov tasdiqlangach o&apos;quvchilar shu yerda ko&apos;rinadi.</p> : students.map((student) => (
            <div className="teacher-student-row" key={student.userId}>
              <div><b>{student.fullName}</b><p className="hint">{student.login ? `@${student.login}` : student.phone ?? ""} · {student.completedLessons}/16 dars · quiz {student.quizPercent}%</p></div>
              {latestSession?.sessionId && <form action={markAttendance} className="teacher-attendance-form">
                <input type="hidden" name="cohortId" value={cohort.id} /><input type="hidden" name="sessionId" value={latestSession.sessionId} /><input type="hidden" name="studentId" value={student.userId} />
                <select name="status" defaultValue="present"><option value="present">Qatnashdi</option><option value="late">Kechikdi</option><option value="absent">Qatnashmadi</option><option value="excused">Sababli</option></select>
                <button className="btn btn-ghost">Davomat</button>
              </form>}
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function formatDisplay(value: string) {
  return new Date(value).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function toDateTimeLocal(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
