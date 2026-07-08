import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ModuleIcon } from "@/components/course/ModuleIcon";
import { LessonCard } from "@/components/course/LessonCard";
import { PurchasePanel } from "@/components/course/PurchasePanel";
import { allLessons, formatUzs } from "@/lib/course-data";
import { getCourseAsync } from "@/lib/course";
import { getCurrentUser } from "@/lib/auth";
import { getActiveEnrollment } from "@/lib/access";
import { startCheckout } from "./actions";
import type { PricingKind } from "@/lib/types";

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const { slug } = await params;
  const { plan } = await searchParams;

  const course = await getCourseAsync(slug);
  if (!course) notFound();

  const user = await getCurrentUser();
  const enrollment = user ? await getActiveEnrollment(user.id, slug) : null;
  const unlocked = enrollment !== null;
  const unlockedThrough = enrollment?.unlockedThrough ?? null;
  const isPartial = unlocked && unlockedThrough !== null;
  const canOpenLesson = (order: number, isPreview: boolean) =>
    isPreview || (unlocked && (unlockedThrough === null || order <= unlockedThrough));
  const firstLesson = allLessons(course)[0];
  const defaultPlan: PricingKind = plan === "installment2" ? "installment2" : "lifetime";

  return (
    <>
      <SiteNav cta={unlocked ? { href: "/dashboard", label: "Kabinet" } : { href: "#narx", label: "Yozilish" }} />
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
                  <input type="hidden" name="provider" value="payme" />
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
              <div id="narx">
                <PurchasePanel course={course} defaultPlan={defaultPlan} />
              </div>
            )}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
