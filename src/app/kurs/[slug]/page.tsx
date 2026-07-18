import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ModuleIcon } from "@/components/course/ModuleIcon";
import { LessonCard } from "@/components/course/LessonCard";
import { allLessons, formatUzs } from "@/lib/course-data";
import { getCourseAsync } from "@/lib/course";
import { getCurrentUser } from "@/lib/auth";
import { getActiveEnrollment, canAccessLesson } from "@/lib/access";
import { getRequestStatus } from "@/lib/enrollment-requests";
import { startCheckout, requestEnrollment } from "./actions";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const course = await getCourseAsync(slug);
  if (!course) notFound();

  const user = await getCurrentUser();
  const enrollment = user ? await getActiveEnrollment(user.id, slug) : null;
  const unlocked = enrollment !== null;
  const unlockedThrough = enrollment?.unlockedThrough ?? null;
  const isPartial = unlocked && unlockedThrough !== null;
  const requestStatus = user && !unlocked ? await getRequestStatus(user.id, slug) : null;
  const allCourseLessons = allLessons(course);
  const accessibleOrders = new Set(user ? await Promise.all(allCourseLessons.map(async (lesson) => (await canAccessLesson(user.id, slug, lesson.order)) ? lesson.order : 0)) : []);
  const canOpenLesson = (order: number, isPreview: boolean) => isPreview || accessibleOrders.has(order);
  const firstLesson = allCourseLessons[0];

  return (
    <>
      <SiteNav cta={unlocked ? { href: "/dashboard", label: "Kabinet" } : { href: "/register", label: "Ro'yxatdan o'tish" }} />
      <main className="shell">
        {/* Sarlavha */}
        <div style={{ maxWidth: 720, marginBottom: 36 }}>
          <div className="page-eyebrow">Kurs · {course.year}</div>
          <h1 className="page-title">{course.title}</h1>
          <p className="page-sub">{course.subtitle}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="badge badge-blue">16 dars</span>
            <span className="badge badge-gray">6 modul</span>
            <span className="badge badge-gray">120 daq / dars</span>
            {unlocked && !isPartial && <span className="badge badge-green">✓ Sizda ochiq</span>}
            {isPartial && <span className="badge badge-blue">1–{unlockedThrough}-darslar ochiq</span>}
          </div>
        </div>

        <div className="learn-grid">
          {/* Chap: dastur */}
          <div>
            {course.modules.map((m) => (
              <section
                key={m.order}
                style={{ marginBottom: 40, ["--accent" as string]: `var(--${m.accent})` }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                  <ModuleIcon order={m.order} />
                  <div>
                    <div className="m-num">{m.code}</div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>{m.title}</h2>
                  </div>
                </div>
                <div className={`lessons${m.lessons.length === 2 ? " solo" : ""}`}>
                  {m.lessons.map((l) => {
                    const canOpen = canOpenLesson(l.order, l.isPreview);
                    return (
                      <LessonCard
                        key={l.order}
                        lesson={l}
                        unlocked={canOpen}
                        href={canOpen ? `/learn/${course.slug}/${l.order}` : undefined}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* O'ng: sotib olish, qolganini ochish, yoki davom ettirish */}
          <aside>
            {isPartial ? (
              <div className="panel" style={{ position: "sticky", top: 72 }} id="narx">
                <span className="badge badge-blue" style={{ marginBottom: 12 }}>Qisman ochiq</span>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
                  1–{unlockedThrough}-darslar ochiq
                </div>
                <p className="hint" style={{ marginBottom: 18 }}>
                  Qolgan darslarni ochish uchun ikkinchi to&apos;lovni ({formatUzs(
                    course.pricing.find((p) => p.kind === "installment2")?.priceUzs ?? 0,
                  )}) amalga oshiring.
                </p>
                <form action={startCheckout}>
                  <input type="hidden" name="slug" value={course.slug} />
                  <input type="hidden" name="kind" value="installment2" />
                  <input type="hidden" name="provider" value="manual" />
                  <input type="hidden" name="step" value="2" />
                  <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                    Qolganini ochish →
                  </button>
                </form>
                <Link
                  href={`/learn/${course.slug}/${firstLesson.order}`}
                  className="btn btn-ghost"
                  style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                >
                  Ochiq darslarni ko&apos;rish
                </Link>
              </div>
            ) : unlocked ? (
              <div className="panel" style={{ position: "sticky", top: 72 }}>
                <span className="badge badge-green" style={{ marginBottom: 12 }}>✓ Kirish ochiq</span>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Kursingiz tayyor</div>
                <p className="hint" style={{ marginBottom: 18 }}>
                  Barcha 16 darsga kirishingiz bor. Qoldirgan joyingizdan davom eting.
                </p>
                <Link
                  href={`/learn/${course.slug}/${firstLesson.order}`}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Darsni ochish →
                </Link>
                <Link
                  href="/dashboard"
                  className="btn btn-ghost"
                  style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                >
                  Kabinetga o&apos;tish
                </Link>
              </div>
            ) : (
              <div className="panel" style={{ position: "sticky", top: 72 }} id="narx">
                {!user ? (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Kursga yozilish</div>
                    <p className="hint" style={{ marginBottom: 18 }}>
                      Ro&apos;yxatdan o&apos;ting — ustoz tasdiqlagach barcha darslar, testlar va vazifalar ochiladi. 1-dars hoziroq bepul.
                    </p>
                    <Link href="/register" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                      Ro&apos;yxatdan o&apos;tish →
                    </Link>
                    <Link
                      href={`/learn/${course.slug}/${firstLesson.order}`}
                      className="btn btn-ghost"
                      style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                    >
                      Bepul 1-darsni ko&apos;rish
                    </Link>
                  </>
                ) : requestStatus?.status === "pending" ? (
                  <>
                    <span className="badge badge-blue" style={{ marginBottom: 12 }}>Ko&apos;rib chiqilmoqda</span>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Arizangiz yuborildi</div>
                    <p className="hint">
                      Ustoz tasdiqlagach barcha darslar ochiladi. Birinchi darsni hozir ko&apos;rishingiz mumkin.
                    </p>
                    <Link
                      href={`/learn/${course.slug}/${firstLesson.order}`}
                      className="btn btn-ghost"
                      style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
                    >
                      1-darsni ko&apos;rish
                    </Link>
                  </>
                ) : requestStatus?.status === "rejected" ? (
                  <>
                    <span className="badge badge-red" style={{ marginBottom: 12 }}>Rad etilgan</span>
                    <p className="hint" style={{ marginBottom: 18 }}>
                      Arizangiz hozircha tasdiqlanmadi. Qayta murojaat qiling yoki ustoz bilan bog&apos;laning.
                    </p>
                    <form action={requestEnrollment}>
                      <input type="hidden" name="slug" value={course.slug} />
                      <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                        Qayta ariza yuborish
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Kursga yozilish</div>
                    <p className="hint" style={{ marginBottom: 18 }}>
                      Ariza yuboring — ustoz tasdiqlagach darslar ochiladi.
                    </p>
                    <form action={requestEnrollment}>
                      <input type="hidden" name="slug" value={course.slug} />
                      <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                        Ariza yuborish →
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
