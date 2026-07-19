import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getLesson, allLessons } from "@/lib/course-data";
import type { LessonContentBlock } from "@/lib/types";
import { getCourseAsync } from "@/lib/course";
import { getCurrentUser } from "@/lib/auth";
import { canAccessLesson, getActiveEnrollment } from "@/lib/access";
import { getRequestStatus } from "@/lib/enrollment-requests";
import { getCompleted, percentOf } from "@/lib/progress";
import { LessonSlides } from "@/components/lesson/LessonSlides";
import { HomeworkPanel } from "@/components/lesson/HomeworkPanel";
import { getSubmission } from "@/lib/homework";
import { completeAndNext, unmarkComplete } from "@/app/learn/actions";
import { VideoPlayer } from "@/components/VideoPlayer";
import { LessonContent } from "@/components/lesson/LessonContent";
import { LessonQuiz } from "@/components/lesson/LessonQuiz";
import { AiSandbox } from "@/components/lesson/AiSandbox";
import { getLessonQuiz, getQuizAnswers } from "@/lib/quiz";
import { signVideoUrl, watermarkText } from "@/lib/video";
import { getStudentCohortContext } from "@/lib/cohorts";

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
  searchParams: Promise<{ welcome?: string; done?: string }>;
}) {
  const { slug, lessonId } = await params;
  const { welcome, done } = await searchParams;

  const course = await getCourseAsync(slug);
  if (!course) notFound();

  const order = Number(lessonId);
  const found = getLesson(course, order);
  if (!found) notFound();
  const { lesson } = found;

  const user = await getCurrentUser();
  const lessons = allLessons(course);
  const [access, cohortContext] = await Promise.all([
    user ? canAccessLesson(user.id, slug, order) : false,
    user ? getStudentCohortContext(user.id, slug) : null,
  ]);
  const accessibleOrders = new Set(user ? await Promise.all(lessons.map(async (item) => (await canAccessLesson(user.id, slug, item.order)) ? item.order : 0)) : []);

  // Preview bo'lmagan darsni ko'rish uchun kirish shart.
  if (!lesson.isPreview && !user) {
    redirect(`/login?next=${encodeURIComponent(`/learn/${slug}/${order}`)}`);
  }

  const locked = !access && !lesson.isPreview;
  const lockReason = locked && user ? await getLockReason(user.id, slug, order) : null;
  const completed = user ? await getCompleted(user.id, slug) : [];
  const isDone = completed.includes(order);
  const pct = percentOf(course, completed);

  const idx = lessons.findIndex((l) => l.order === order);
  const prev = lessons[idx - 1];
  const next = lessons[idx + 1];

  const quiz = access && user ? await getLessonQuiz(slug, order) : [];
  const quizAnswers = access && user ? await getQuizAnswers(user.id, quiz.map((question) => question.id)) : new Map();
  const cohortLesson = cohortContext?.lessons.find((item) => item.order === order);
  const signedVideo = access && user ? signVideoUrl(lesson.videoKey, user.id) : { url: null, expiresAt: 0 };
  const youtubeId = cohortLesson?.youtubeId ?? lesson.youtubeId;
  const taskBlock = lesson.content?.find(
    (b): b is Extract<LessonContentBlock, { type: "task" }> => b.type === "task",
  );
  const submission = access && user && taskBlock ? await getSubmission(user.id, slug, order) : null;

  return (
    <>
      <SiteNav
        links={[{ href: `/kurs/${slug}`, label: "Kurs sahifasi" }]}
        cta={user ? { href: "/dashboard", label: "Kabinet" } : { href: "/login", label: "Kirish" }}
        secondaryCta={!user ? { href: "/register", label: "Ro'yxatdan o'tish" } : undefined}
      />
      <main className="shell">
        {welcome && (
          <div className="panel" style={{ marginBottom: 20, background: "color-mix(in srgb, var(--green) 10%, var(--card-bg))" }}>
            <b>🎉 Tabriklaymiz!</b> To&apos;lov qabul qilindi va kursga kirish ochildi. Yaxshi o&apos;qishlar!
          </div>
        )}
        {done && pct === 100 && (
          <div className="panel" style={{ marginBottom: 20, background: "color-mix(in srgb, var(--green) 12%, var(--card-bg))" }}>
            <b>🏆 Kursni tamomladingiz!</b> Barcha {lessons.length} dars yakunlandi. Endi portfolioingizni yig&apos;ing.
          </div>
        )}
        {done && pct < 100 && (
          <div className="panel" style={{ marginBottom: 20, background: "color-mix(in srgb, var(--green) 10%, var(--card-bg))" }}>
            <b>✓ Dars belgilandi.</b> Hali {lessons.length - completed.length} dars qoldi — kabinetdan davom eting.
          </div>
        )}

        <div className="learn-grid">
          {/* Chap: dars kontenti */}
          <div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span className="page-eyebrow" style={{ margin: 0 }}>Dars {String(lesson.order).padStart(2, "0")}</span>
                {isDone && <span className="badge badge-green">✓ Yakunlangan</span>}
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.025em", marginBottom: 16 }}>
                {lesson.title}
              </h1>
              <div className="rows" style={{ maxWidth: 640 }}>
                {lesson.rows.map((r) => (
                  <div className="row" key={r.kind} style={{ ["--accent" as string]: "var(--blue)" }}>
                    <span className={`tag${r.kind === "Natija" ? " out" : ""}`}>{r.kind}</span>
                    <span className="txt">{r.text}</span>
                  </div>
                ))}
              </div>

              {(access || lesson.isPreview) && (
                <>
                  <div style={{ marginTop: 24 }}>
                    <VideoPlayer
                      signedUrl={signedVideo.url}
                      youtubeId={youtubeId}
                      watermark={user ? watermarkText(user) : "TECH JADID · PREVIEW"}
                      locked={false}
                    />
                  </div>
                  {cohortLesson?.sessionStartsAt && (
                    <div className="panel" style={{ marginTop: 14 }}>
                      <b>Jonli dars: {new Date(cohortLesson.sessionStartsAt).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" })}</b>
                      {cohortLesson.meetUrl && (
                        <a href={cohortLesson.meetUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ marginTop: 12 }}>Google Meet&apos;ga kirish</a>
                      )}
                    </div>
                  )}
                  <LessonSlides lesson={lesson} />
                  <LessonContent blocks={lesson.content ?? []} />
                </>
              )}

              {locked ? (
                <div className="panel" style={{ marginTop: 24 }}>
                  <b>Bu dars qulflangan.</b>
                  <p className="hint" style={{ margin: "8px 0 14px" }}>
                    {lockReason === "pending"
                      ? "Arizangiz ustoz tomonidan ko'rib chiqilmoqda. Tasdiqlangach dars ochiladi."
                      : lockReason === "rejected"
                        ? "Arizangiz hozircha tasdiqlanmadi. Qayta murojaat qiling."
                        : lockReason === "scheduled"
                          ? "Bu dars jonli guruh jadvali bo'yicha hali ochilmagan. Ochilish vaqtini kabinetdagi jadvaldan ko'ring."
                          : lockReason === "partial"
                            ? "Bu dars qolgan qismga tegishli — ustozga murojaat qiling."
                            : "Kursga ariza yuboring — to'lov tasdiqlangach dars jadvali ochiladi."}
                  </p>
                  <Link href={`/kurs/${slug}#narx`} className="btn btn-primary">
                    {lockReason === "scheduled" ? "Kabinetdagi jadval →" : "Kurs sahifasiga o'tish →"}
                  </Link>
                </div>
              ) : (
                access && (
                  <>
                  <LessonQuiz slug={slug} order={order} questions={quiz} answers={quizAnswers} />
                  {lesson.sandboxEnabled && <AiSandbox slug={slug} order={order} />}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 24 }}>
                    <form action={completeAndNext}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="order" value={order} />
                      <button type="submit" className="btn btn-primary">
                        {next ? "Yakunladim — keyingisi →" : "Yakunladim ✓"}
                      </button>
                    </form>
                    {isDone && (
                      <form action={unmarkComplete}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="order" value={order} />
                        <button type="submit" className="btn btn-ghost">Belgini olib tashlash</button>
                      </form>
                    )}
                  </div>
                  {taskBlock && (
                    <HomeworkPanel
                      slug={slug}
                      order={order}
                      taskTitle={taskBlock.title}
                      taskText={taskBlock.text}
                      checklist={taskBlock.checklist}
                      submission={submission}
                    />
                  )}
                  </>
                )
              )}

              {lesson.isPreview && !user && (
                <div className="panel preview-cta">
                  <b>Bepul darsni ko&apos;rdingiz — keyingi qadamni saqlab qoling</b>
                  <p className="hint">Hisob yaratsangiz arizangiz ustozga boradi. Guruh sanasi va to&apos;lov siz bilan kelishilgandan keyingina davom etasiz.</p>
                  <div className="preview-cta-actions">
                    <Link href="/register" className="btn btn-primary">Ro&apos;yxatdan o&apos;tish →</Link>
                    <Link href={`/login?next=${encodeURIComponent(`/learn/${slug}/${order}`)}`} className="btn btn-ghost">Hisobim bor</Link>
                  </div>
                </div>
              )}

              {/* Oldingi / keyingi */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 28 }}>
                {prev ? (
                  <Link
                    href={accessibleOrders.has(prev.order) || prev.isPreview ? `/learn/${slug}/${prev.order}` : `/kurs/${slug}#narx`}
                    className="btn btn-ghost"
                  >
                    ← Oldingi
                  </Link>
                ) : <span />}
                {next ? (
                  <Link
                    href={accessibleOrders.has(next.order) || next.isPreview ? `/learn/${slug}/${next.order}` : `/kurs/${slug}#narx`}
                    className="btn btn-ghost"
                  >
                    Keyingi →
                  </Link>
                ) : <span />}
              </div>
            </div>
          </div>

          {/* O'ng: progress + darslar ro'yxati */}
          <aside>
            <div className="panel" style={{ position: "sticky", top: 72 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{course.title}</div>
              <p className="hint" style={{ marginBottom: 12 }}>
                {completed.length} / {lessons.length} dars yakunlangan
              </p>
              <div className="progress" style={{ marginBottom: 18 }}>
                <span style={{ width: `${pct}%` }} />
              </div>
              <div className="lesson-list">
                {lessons.map((l) => {
                  const isActive = l.order === lesson.order;
                  const lessonAccess = accessibleOrders.has(l.order);
                  const openable = lessonAccess || l.isPreview;
                  const lDone = completed.includes(l.order);
                  return (
                    <Link
                      key={l.order}
                      href={openable ? `/learn/${slug}/${l.order}` : `/kurs/${slug}#narx`}
                      className={`lesson-item${isActive ? " active" : ""}`}
                    >
                      <span className="li-num" style={lDone ? { color: "var(--green)" } : undefined}>
                        {lDone ? "✓" : String(l.order).padStart(2, "0")}
                      </span>
                      <span className="li-title">{l.title}</span>
                      {l.isPreview ? (
                        <span className="li-lock" style={{ color: "var(--green)" }}>bepul</span>
                      ) : lessonAccess ? null : (
                        <span className="li-lock">🔒</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

type LockReason = "no-enrollment" | "pending" | "rejected" | "partial" | "scheduled";

/** Dars nega qulflanganini aniqlaydi — foydalanuvchiga to'g'ri xabar ko'rsatish uchun. */
async function getLockReason(userId: string, slug: string, order: number): Promise<LockReason> {
  const enrollment = await getActiveEnrollment(userId, slug);
  if (!enrollment) {
    const request = await getRequestStatus(userId, slug);
    if (request?.status === "pending") return "pending";
    if (request?.status === "rejected") return "rejected";
    return "no-enrollment";
  }
  if (enrollment.unlockedThrough !== null && order > enrollment.unlockedThrough) return "partial";
  return "scheduled";
}
