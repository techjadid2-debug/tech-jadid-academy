import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth";
import { getEnrollments, isEnrollmentExpired } from "@/lib/access";
import { getRequestStatus } from "@/lib/enrollment-requests";
import { getCompleted, percentOf } from "@/lib/progress";
import { allLessons, COURSES, PRIMARY_COURSE } from "@/lib/course-data";
import { getCourseAsync } from "@/lib/course";
import { getUserBadges, getUserPoints } from "@/lib/gamification";
import { getCertificate } from "@/lib/certificates";
import { logout } from "@/app/login/actions";
import { getStudentCohortContext, isTeacher } from "@/lib/cohorts";
import { getPendingPaymentForUser } from "@/lib/payments/db";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const enrollments = await getEnrollments(user.id);
  const enrolledSlugs = enrollments.map((e) => e.courseSlug);
  const otherCourses = COURSES.filter((c) => !enrolledSlugs.includes(c.slug));

  const [points, badges, cohortPairs, requestPairs, pendingPayments] = await Promise.all([
    getUserPoints(user.id),
    getUserBadges(user.id),
    // Jonli dars konteksti — o'quvchi yozilgan kurslar bo'ylab.
    Promise.all(enrolledSlugs.map(async (slug) => ({ slug, ctx: await getStudentCohortContext(user.id, slug) }))),
    // Ariza va to'lov holati — hali yozilmagan kurslar bo'ylab.
    Promise.all(otherCourses.map(async (c) => ({ slug: c.slug, req: await getRequestStatus(user.id, c.slug) }))),
    Promise.all(otherCourses.map((c) => getPendingPaymentForUser(user.id, c.slug))),
  ]);

  const cohortPair = cohortPairs.find((p) => p.ctx?.nextSession) ?? cohortPairs.find((p) => p.ctx) ?? null;
  const cohortContext = cohortPair?.ctx ?? null;
  const cohortSlug = cohortPair?.slug ?? PRIMARY_COURSE.slug;

  const requestPair =
    requestPairs.find((p) => p.req?.status === "payment_pending") ??
    requestPairs.find((p) => p.req?.status === "contacted") ??
    requestPairs.find((p) => p.req?.status === "pending") ??
    requestPairs.find((p) => p.req?.status === "rejected") ??
    null;
  const requestStatus = requestPair?.req ?? null;
  const requestSlug = requestPair?.slug ?? PRIMARY_COURSE.slug;
  const pendingPayment = pendingPayments.find(Boolean) ?? null;

  // Har kurs uchun kurs + progress foizini oldindan hisoblaymiz.
  const cards = await Promise.all(
    enrollments.map(async (e) => {
      const course = await getCourseAsync(e.courseSlug);
      if (!course) return null;
      const completed = await getCompleted(user.id, e.courseSlug);
      const pct = percentOf(course, completed);
      const lessons = allLessons(course);
      // Keyingi tugallanmagan dars (yo'q bo'lsa — birinchisi)
      const nextLesson = lessons.find((l) => !completed.includes(l.order)) ?? lessons[0];
      const certificate = pct === 100 ? await getCertificate(user.id, e.courseSlug) : null;
      return {
        enrollment: e,
        course,
        pct,
        completedCount: completed.length,
        total: lessons.length,
        nextLesson,
        certificate,
        isExpired: isEnrollmentExpired(e),
      };
    }),
  );

  return (
    <>
      <SiteNav links={[]} cta={{ href: "/", label: "Kurslar" }} />
      <main className="shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
          <div>
            <div className="page-eyebrow">Kabinet</div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>Salom, {user.name}! 👋</h1>
            <p className="hint">{user.phone || user.email}{user.role === "admin" ? " · admin" : ""}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {isTeacher(user) && (
              <Link href="/teacher" className="btn btn-ghost">Ustoz kabineti</Link>
            )}
            {user.role === "admin" && (
              <Link href="/admin" className="btn btn-ghost">Admin panel</Link>
            )}
            <form action={logout}>
              <button type="submit" className="btn btn-ghost">Chiqish</button>
            </form>
          </div>
        </div>

        {cohortContext?.nextSession && (
          <section className="panel student-live-card">
            <div className="page-eyebrow">Keyingi jonli dars · {cohortContext.cohort.title}</div>
            <h2>{String(cohortContext.nextSession.order).padStart(2, "0")} · {cohortContext.nextSession.title}</h2>
            <p className="hint">{new Date(cohortContext.nextSession.sessionStartsAt!).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent", dateStyle: "medium", timeStyle: "short" })}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <Link href={`/learn/${cohortSlug}/${cohortContext.nextSession.order}`} className="btn btn-primary">Dars sahifasi →</Link>
              {cohortContext.cohort.telegramUrl && <a href={cohortContext.cohort.telegramUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">Telegram guruh</a>}
            </div>
          </section>
        )}

        {cohortContext && cohortContext.announcements.length > 0 && (
          <section className="student-announcements" aria-label="Guruh e'lonlari">
            {cohortContext.announcements.slice(0, 3).map((announcement) => <article key={announcement.id}><b>{announcement.title}</b><p>{announcement.body}</p><span className="hint">{new Date(announcement.publishedAt).toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" })}</span></article>)}
          </section>
        )}

        {/* Streak / ball / nishonlar (real rejimda faollik bo'lsa) */}
        {points && (
          <div className="panel" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700 }}>🔥 {points.currentStreak} kun</div>
                <div className="hint">Joriy seriya (eng uzuni: {points.longestStreak})</div>
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700 }}>⭐ {points.totalPoints}</div>
                <div className="hint">Jami ball</div>
              </div>
              {badges.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {badges.map((b) => (
                    <span key={b.code} className="badge badge-blue" title={b.description}>
                      {b.icon} {b.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Mening kurslarim</h2>

        {cards.filter(Boolean).length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: 40 }}>
            {requestStatus?.status === "payment_pending" && pendingPayment ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Shaxsiy buyurtmangiz tayyor</div>
                <p className="hint" style={{ marginBottom: 20 }}>Chek tasdiqlangach jonli guruh va dars jadvali avtomatik ochiladi.</p>
                <Link href={`/checkout?order=${pendingPayment.id}`} className="btn btn-primary">To&apos;lovga o&apos;tish →</Link>
              </>
            ) : requestStatus?.status === "pending" || requestStatus?.status === "contacted" ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{requestStatus.status === "contacted" ? "Ustoz siz bilan aloqaga chiqmoqda" : "Arizangiz ko'rib chiqilmoqda"}</div>
                <p className="hint" style={{ marginBottom: 20 }}>
                  Guruh va tarif aniqlangach shu yerda shaxsiy checkout paydo bo&apos;ladi. Hozircha 1-darsni bepul ko&apos;rishingiz mumkin.
                </p>
                <Link href={`/learn/${requestSlug}/1`} className="btn btn-primary">1-darsni ko&apos;rish →</Link>
              </>
            ) : requestStatus?.status === "rejected" ? (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Arizangiz tasdiqlanmadi</div>
                <p className="hint" style={{ marginBottom: 20 }}>Qayta murojaat qiling yoki ustoz bilan bog&apos;laning.</p>
                <Link href={`/kurs/${requestSlug}#narx`} className="btn btn-primary">Qayta ariza yuborish →</Link>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Hali kursingiz yo&apos;q</div>
                <p className="hint" style={{ marginBottom: 20 }}>Katalogdan kurs tanlang — AI Video Creator yoki AI Builder — va o&apos;rganishni boshlang.</p>
                <Link href="/" className="btn btn-primary">Kurslarni ko&apos;rish →</Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid-2">
            {cards.map((c) => {
              if (!c) return null;
              const { enrollment: e, course, pct, completedCount, total, nextLesson, certificate, isExpired } = c;
              const isPartial = !isExpired && e.unlockedThrough !== null;
              return (
                <div className="panel" key={course.slug}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span
                      className={`badge ${isExpired ? "badge-red" : isPartial ? "badge-blue" : e.source === "monthly" ? "badge-blue" : "badge-green"}`}
                    >
                      {isExpired
                        ? "Muddati tugagan"
                        : isPartial
                          ? `1–${e.unlockedThrough}-darslar ochiq`
                          : e.source === "monthly"
                            ? "Oylik obuna"
                            : "Doimiy kirish"}
                    </span>
                    {e.expiresAt && (
                      <span className="hint">
                        {isExpired ? "tugadi: " : ""}
                        {new Date(e.expiresAt).toLocaleDateString("uz-UZ")}
                        {isExpired ? "" : " gacha"}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{course.title}</div>
                  <p className="hint" style={{ marginBottom: 12 }}>
                    {completedCount} / {total} dars · {pct}%
                  </p>
                  <div className="progress" style={{ marginBottom: 14 }}>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  {isExpired ? (
                    <Link href={`/kurs/${course.slug}#narx`} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                      Obunani uzaytirish →
                    </Link>
                  ) : (
                    <Link href={`/learn/${course.slug}/${nextLesson.order}`} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                      {pct === 0 ? "Boshlash →" : pct === 100 ? "Qayta ko'rish" : "Davom etish →"}
                    </Link>
                  )}
                  {isPartial && (
                    <Link
                      href={`/kurs/${course.slug}#narx`}
                      className="btn btn-ghost"
                      style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                    >
                      Qolgan darslarni ochish →
                    </Link>
                  )}
                  {certificate && (
                    <Link
                      href={`/certificate/${certificate.code}`}
                      className="btn btn-ghost"
                      style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                    >
                      🎓 Sertifikatni ko&apos;rish →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
