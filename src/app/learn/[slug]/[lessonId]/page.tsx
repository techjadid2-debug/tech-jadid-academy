import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { VideoPlayer } from "@/components/VideoPlayer";
import { getCourse, getLesson, allLessons } from "@/lib/course-data";
import { getCurrentUser } from "@/lib/auth";
import { hasAccess } from "@/lib/access";
import { getCompleted, percentOf } from "@/lib/progress";
import { signVideoUrl, watermarkText } from "@/lib/video";
import { completeAndNext, unmarkComplete } from "@/app/learn/actions";

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
  searchParams: Promise<{ welcome?: string; done?: string }>;
}) {
  const { slug, lessonId } = await params;
  const { welcome, done } = await searchParams;

  const course = getCourse(slug);
  if (!course) notFound();

  const order = Number(lessonId);
  const found = getLesson(course, order);
  if (!found) notFound();
  const { lesson } = found;

  const user = await getCurrentUser();
  const access = user ? await hasAccess(user.id, slug) : false;

  // Preview bo'lmagan darsni ko'rish uchun kirish shart.
  if (!lesson.isPreview && !user) {
    redirect(`/login?next=${encodeURIComponent(`/learn/${slug}/${order}`)}`);
  }

  const locked = !access && !lesson.isPreview;
  const canWatch = access || lesson.isPreview;

  // Video imzosi faqat huquq tasdiqlangach beriladi.
  const signed = canWatch && user ? signVideoUrl(lesson.videoKey, user.id) : { url: null, expiresAt: 0 };
  const wm = user ? watermarkText(user) : "Mehmon · preview";

  const lessons = allLessons(course);
  const completed = user ? await getCompleted(user.id, slug) : [];
  const isDone = completed.includes(order);
  const pct = percentOf(course, completed);

  const idx = lessons.findIndex((l) => l.order === order);
  const prev = lessons[idx - 1];
  const next = lessons[idx + 1];

  return (
    <>
      <SiteNav
        links={[{ href: `/kurs/${slug}`, label: "Kurs sahifasi" }]}
        cta={{ href: "/dashboard", label: "Kabinet" }}
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
          {/* Chap: player + tavsif */}
          <div>
            <VideoPlayer
              signedUrl={signed.url}
              youtubeId={lesson.isPreview ? lesson.youtubeId : null}
              watermark={wm}
              locked={locked}
            />

            <div style={{ marginTop: 22 }}>
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

              {locked ? (
                <div className="panel" style={{ marginTop: 24 }}>
                  <b>Bu dars qulflangan.</b>
                  <p className="hint" style={{ margin: "8px 0 14px" }}>
                    To&apos;liq kursni ochish uchun sotib oling yoki oylik obuna bo&apos;ling.
                  </p>
                  <Link href={`/kurs/${slug}#narx`} className="btn btn-primary">
                    Kursni ochish →
                  </Link>
                </div>
              ) : (
                access && (
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
                )
              )}

              {/* Oldingi / keyingi */}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 28 }}>
                {prev ? (
                  <Link
                    href={access || prev.isPreview ? `/learn/${slug}/${prev.order}` : `/kurs/${slug}#narx`}
                    className="btn btn-ghost"
                  >
                    ← Oldingi
                  </Link>
                ) : <span />}
                {next ? (
                  <Link
                    href={access || next.isPreview ? `/learn/${slug}/${next.order}` : `/kurs/${slug}#narx`}
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
                  const openable = access || l.isPreview;
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
                      ) : access ? null : (
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
