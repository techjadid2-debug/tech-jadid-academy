import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth";
import { AI_FOUNDATIONS, formatUzs } from "@/lib/course-data";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") {
    return (
      <>
        <SiteNav links={[]} cta={{ href: "/dashboard", label: "Kabinet" }} />
        <main className="shell-narrow" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h1 className="page-title">Ruxsat yo&apos;q</h1>
          <p className="page-sub">Bu sahifa faqat administratorlar uchun.</p>
          <Link href="/dashboard" className="btn btn-primary">Kabinetga qaytish</Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  const course = AI_FOUNDATIONS;
  const lessonCount = course.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <>
      <SiteNav links={[]} cta={{ href: "/dashboard", label: "Kabinet" }} />
      <main className="shell">
        <div className="page-eyebrow">Admin panel</div>
        <h1 className="page-title">Kontent boshqaruvi</h1>
        <p className="page-sub">Kurslar, modullar va darslarni boshqaring. (Tahrirlash — Supabase ulangach faollashadi.)</p>

        {/* Statistika */}
        <div className="grid-2" style={{ marginBottom: 28 }}>
          <Stat label="Kurslar" value="1" />
          <Stat label="Modullar" value={String(course.modules.length)} />
          <Stat label="Darslar" value={String(lessonCount)} />
          <Stat label="Tariflar" value={String(course.pricing.length)} />
        </div>

        {/* Narxlar */}
        <div className="panel" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <b>Narxlar</b>
            <button className="btn btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }} disabled>Tahrirlash</button>
          </div>
          {course.pricing.map((p) => (
            <div key={p.kind} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--line)" }}>
              <span>{p.label}</span>
              <b>{formatUzs(p.priceUzs)}{p.kind === "monthly" ? " / oy" : ""}</b>
            </div>
          ))}
        </div>

        {/* Darslar */}
        <div className="panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <b>{course.title} — dastur</b>
            <button className="btn btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }} disabled>+ Dars qo&apos;shish</button>
          </div>
          {course.modules.map((m) => (
            <div key={m.order} style={{ marginTop: 16 }}>
              <div className="m-num" style={{ ["--accent" as string]: `var(--${m.accent})` }}>{m.code} · {m.title}</div>
              <div className="lesson-list" style={{ marginTop: 6 }}>
                {m.lessons.map((l) => (
                  <div key={l.order} className="lesson-item" style={{ cursor: "default" }}>
                    <span className="li-num">{String(l.order).padStart(2, "0")}</span>
                    <span className="li-title">{l.title}</span>
                    <span className="li-lock">
                      {l.isPreview ? "bepul preview" : l.videoKey ? "video kaliti bor" : "video yo'q"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="hint">{label}</div>
    </div>
  );
}
