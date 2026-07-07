import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth";
import { getEnrollments } from "@/lib/access";
import { getCompleted, percentOf } from "@/lib/progress";
import { getCourse, allLessons } from "@/lib/course-data";
import { logout } from "@/app/login/actions";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const enrollments = await getEnrollments(user.id);

  // Har kurs uchun kurs + progress foizini oldindan hisoblaymiz.
  const cards = await Promise.all(
    enrollments.map(async (e) => {
      const course = getCourse(e.courseSlug);
      if (!course) return null;
      const completed = await getCompleted(user.id, e.courseSlug);
      const pct = percentOf(course, completed);
      const lessons = allLessons(course);
      // Keyingi tugallanmagan dars (yo'q bo'lsa — birinchisi)
      const nextLesson = lessons.find((l) => !completed.includes(l.order)) ?? lessons[0];
      return { enrollment: e, course, pct, completedCount: completed.length, total: lessons.length, nextLesson };
    }),
  );

  return (
    <>
      <SiteNav links={[]} cta={{ href: "/kurs/ai-asoslari", label: "Kurslar" }} />
      <main className="shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
          <div>
            <div className="page-eyebrow">Kabinet</div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>Salom, {user.name}! 👋</h1>
            <p className="hint">{user.phone || user.email}{user.role === "admin" ? " · admin" : ""}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {user.role === "admin" && (
              <Link href="/admin" className="btn btn-ghost">Admin panel</Link>
            )}
            <form action={logout}>
              <button type="submit" className="btn btn-ghost">Chiqish</button>
            </form>
          </div>
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Mening kurslarim</h2>

        {cards.filter(Boolean).length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Hali kursingiz yo&apos;q</div>
            <p className="hint" style={{ marginBottom: 20 }}>AI Asoslari kursini oching va o&apos;rganishni boshlang.</p>
            <Link href="/kurs/ai-asoslari" className="btn btn-primary">Kursni ko&apos;rish →</Link>
          </div>
        ) : (
          <div className="grid-2">
            {cards.map((c) => {
              if (!c) return null;
              const { enrollment: e, course, pct, completedCount, total, nextLesson } = c;
              return (
                <div className="panel" key={course.slug}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span className={`badge ${e.source === "monthly" ? "badge-blue" : "badge-green"}`}>
                      {e.source === "monthly" ? "Oylik obuna" : "Doimiy kirish"}
                    </span>
                    {e.expiresAt && (
                      <span className="hint">
                        {new Date(e.expiresAt).toLocaleDateString("uz-UZ")} gacha
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
                  <Link href={`/learn/${course.slug}/${nextLesson.order}`} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                    {pct === 0 ? "Boshlash →" : pct === 100 ? "Qayta ko'rish" : "Davom etish →"}
                  </Link>
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
