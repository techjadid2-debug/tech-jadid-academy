import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { COURSES, allLessons, formatUzs } from "@/lib/course-data";
import { getCourseAsync } from "@/lib/course";
import { getCurrentUser } from "@/lib/auth";
import { getPublicCohortSummary } from "@/lib/cohorts";
import type { Course } from "@/lib/types";

const WHO_FOR = [
  { ico: "🎬", h: "Kontent kreatori", p: "AI Video Creator bilan g'oyadan professional videogacha: rasm, video, ovoz va montajni AI orqali yaratasiz." },
  { ico: "🚀", h: "Quruvchi / tadbirkor", p: "AI Builder bilan website, AI web-app, Telegram bot va agentdan iborat bitta real mahsulot qurasiz." },
  { ico: "💼", h: "Kasb egasi", p: "Ikkala kursda ham avval bepul vositalar bilan boshlaysiz, keyin doimiy ish uchun Pro tariflarni o'rganasiz." },
];

const LAB_STEPS = [
  { n: "15′", h: "Nazariya", p: "Bugungi aniq maqsad va kerakli tushuncha." },
  { n: "25′", h: "Live build", p: "Ustoz bilan ekranda birga quramiz." },
  { n: "65′", h: "O'z loyihangiz", p: "Siz o'z loyihangizni qurasiz — ustoz yordamida." },
  { n: "15′", h: "Code review", p: "Debugging va natijani birga baholaymiz." },
];

const FAQ = [
  { q: "Ikki kursning farqi nima?", a: "AI Video Creator — AI bilan professional video, rasm va ovoz yaratish (kontent kreatorlari uchun). AI Builder — website, AI web-app, Telegram bot va agentdan iborat bitta to'liq mahsulot qurish (quruvchilar uchun)." },
  { q: "Kod yozishni bilishim shartmi?", a: "Yo'q. AI Video Creator'da umuman kod kerak emas. AI Builder esa \"vibe coding\" asosida — natijani AI'ga tasvirlab berasiz, kod coding agent tomonidan yoziladi. Boshlang'ich va tajribali ishtirokchilar bir xil boshlaydi." },
  { q: "Har dars qancha davom etadi?", a: "Har dars — 120 daqiqalik project lab: 15 daq nazariya, 25 daq ustoz bilan live build, 65 daq o'quvchi o'z loyihasini quradi, 15 daq debugging va code review. Har dars ko'rsatsa bo'ladigan natija bilan tugaydi." },
  { q: "Qaysi AI tool'lardan foydalanamiz?", a: "Video Creator'da: ChatGPT/Claude, Midjourney/Flux, Runway/Kling/Veo, ElevenLabs, Suno, CapCut. Builder'da: Cursor/Claude/Bolt/v0, Supabase, Vercel, LLM API'lar, MCP. Har vositada avval bepul (yoki limitli) tarif, keyin doimiy ishlatish uchun Pro tarif ko'rsatiladi." },
  { q: "AI vositalari uchun alohida to'lov kerakmi?", a: "Kurs narxi tashqi AI servislarining pullik tariflarini o'z ichiga olmaydi. Darslarda avval bepul variantlar ko'rsatiladi; pullik Pro tarif zarur bo'lsa, xarajat oldindan aytiladi." },
  { q: "Kurs oxirida nimaga ega bo'laman?", a: "AI Video Creator'da — professional AI video va portfolio. AI Builder'da — website + Telegram bot + AI agentdan iborat bitta ishlaydigan mahsulot." },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const cards = await Promise.all(
    COURSES.map(async (base) => {
      const [loaded, cohort] = await Promise.all([
        getCourseAsync(base.slug),
        getPublicCohortSummary(base.slug),
      ]);
      const course = loaded ?? base;
      const lessons = allLessons(course);
      const preview = lessons.find((l) => l.isPreview);
      const lifetime = course.pricing.find((p) => p.kind === "lifetime") ?? course.pricing[0];
      return { course, lessonCount: lessons.length, preview, lifetime, cohort };
    }),
  );

  return (
    <>
      <SiteNav
        cta={user ? { href: "/dashboard", label: "Kabinet" } : { href: "/register", label: "Ro'yxatdan o'tish" }}
        secondaryCta={!user ? { href: "/login", label: "Kirish" } : undefined}
      />
      <Reveal />
      <main id="top">
        {/* HERO */}
        <section className="hero">
          <div className="eyebrow">Tech Jadid akademiya · 2027</div>
          <h1>
            Ikki AI kursi —<br />
            <span className="grad">o&apos;zingizga mosini tanlang.</span>
          </h1>
          <p className="lead">
            2 oy davom etadigan kechki <b>Google Meet</b> darslari va 16 darslik platforma. Har dars —{" "}
            <b>120 daqiqalik project lab</b>. Avval <b>bepul vositalar</b> bilan boshlaysiz, keyin doimiy
            ishlatish uchun <b>Pro tariflarni</b> o&apos;rganasiz. Har dars ko&apos;rsatsa bo&apos;ladigan natija qoldiradi.
          </p>
          <div className="stats">
            <div className="stat"><div className="num">2</div><div className="lbl">Kurs</div></div>
            <div className="stat"><div className="num">16</div><div className="lbl">Dars / kurs</div></div>
            <div className="stat"><div className="num">120<small> daq</small></div><div className="lbl">Project lab</div></div>
            <div className="stat"><div className="num">1</div><div className="lbl">To&apos;liq mahsulot</div></div>
          </div>
          <div className="hero-cta">
            <Link href="#kurslar" className="btn btn-primary">Kurslarni ko&apos;rish ↓</Link>
            <Link href={user ? "/dashboard" : "/register"} className="btn btn-ghost">{user ? "Kabinetga o'tish →" : "Ro'yxatdan o'tish →"}</Link>
          </div>
        </section>

        {/* KURSLAR KATALOGI */}
        <section className="pricing" id="kurslar">
          <h2>Ikki AI kursi</h2>
          <p className="sub">Har kurs mustaqil — birini yoki ikkalasini tanlashingiz mumkin. Har birida to&apos;liq dastur, video darslar va Free→Pro vosita tavsiyalari.</p>
          <div className="course-catalog-grid" style={{ marginTop: 8 }}>
            {cards.map(({ course, lessonCount, preview, lifetime, cohort }) => (
              <article className="panel course-catalog-card" key={course.slug}>
                <div className="page-eyebrow">{course.title} · {course.year}</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>{course.title}</h2>
                <p className="hint" style={{ marginBottom: 14, lineHeight: 1.6 }}>{course.subtitle}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  <span className="badge badge-blue">{course.modules.length} modul</span>
                  <span className="badge badge-gray">{lessonCount} dars</span>
                  <span className="badge badge-gray">120 daq / dars</span>
                </div>
                <CourseModules course={course} />
                {lifetime && (
                  <div style={{ margin: "16px 0 6px", fontWeight: 700, fontSize: 18 }}>
                    {formatUzs(lifetime.priceUzs)}
                    <span className="hint" style={{ fontWeight: 400 }}> · bir martalik</span>
                  </div>
                )}
                <p className="hint" style={{ marginBottom: 16 }}>
                  {cohort ? `${cohort.title}: ${formatCohortStart(cohort.startsAt)} boshlanadi.` : "Guruh sanasi to'lovdan oldin siz bilan kelishiladi."}
                </p>
                <div className="catalog-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link href={`/kurs/${course.slug}`} className="btn btn-primary" style={{ flex: 1, justifyContent: "center", minWidth: 160 }}>
                    Dasturni ko&apos;rish →
                  </Link>
                  {preview && (
                    <Link href={`/learn/${course.slug}/${preview.order}`} className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", minWidth: 140 }}>
                      Bepul 1-dars
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* KIMLAR UCHUN */}
        <section className="whofor">
          <div className="wf-eyebrow">Kimlar uchun</div>
          <h2>Darajangiz muhim emas — natija muhim.</h2>
          <div className="wf-grid">
            {WHO_FOR.map((w) => (
              <div className="wf-item" key={w.h}>
                <span className="wf-ico">{w.ico}</span>
                <h4>{w.h}</h4>
                <p>{w.p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FORMAT — 120 daqiqalik project lab */}
        <section className="course-format" aria-labelledby="format-title">
          <div className="format-inner">
            <div className="wf-eyebrow">Har dars qanday o&apos;tadi</div>
            <h2 id="format-title">120 daqiqalik project lab.</h2>
            <div className="format-grid">
              {LAB_STEPS.map((s) => (
                <article key={s.h}><span>{s.n}</span><b>{s.h}</b><p>{s.p}</p></article>
              ))}
            </div>
            <p className="format-status">Kurs oxirida alohida mashqlar emas — bitta to&apos;liq, ko&apos;rsatsa bo&apos;ladigan mahsulot bo&apos;ladi.</p>
          </div>
        </section>

        {/* INSTRUCTOR */}
        <section className="instructor">
          <div className="in-wrap">
            <div className="in-avatar">AV</div>
            <div>
              <div className="in-eyebrow">Kurslarni kim o&apos;tadi</div>
              <div className="in-name">Abdulvosit</div>
              <p className="in-role">
                AI Engineer &amp; Robototexnika mutaxassisi · Tech Jadid asoschisi. FastAPI, pgvector
                va LLM asosida real AI mahsulotlar quradi (ChaqimchiAI va boshqalar), shu bilan birga
                o&apos;zbek tilida amaliy AI ta&apos;limini rivojlantiradi.
              </p>
              <div className="in-stats">
                <div className="in-stat"><b>120+</b><span>Obunachi</span></div>
                <div className="in-stat"><b>2</b><span>Amaliy kurs</span></div>
                <div className="in-stat"><b>Najot Ta&apos;lim</b><span>Hamkor</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq">
          <div className="faq-eyebrow">Savollar</div>
          <h2>Ko&apos;p so&apos;raladigan savollar</h2>
          {FAQ.map((f, i) => (
            <details className="faq-item" key={f.q} open={i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        {/* FINAL CTA */}
        <section className="final-cta" id="cta">
          <h2>Boshlashga tayyormisiz?</h2>
          <p>Kursni tanlang — ariza qoldiring. Aniq jadval va tarif to&apos;lovdan oldin kelishiladi.</p>
          <Link href="#kurslar" className="btn btn-primary">Kurslarni ko&apos;rish →</Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function CourseModules({ course }: { course: Course }) {
  return (
    <ul style={{ display: "grid", gap: 6, margin: 0, padding: 0, listStyle: "none" }}>
      {course.modules.map((m) => (
        <li key={m.order} style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 14 }}>
          <span className="m-num" style={{ ["--accent" as string]: `var(--${m.accent})`, flexShrink: 0 }}>{m.code}</span>
          <span>{m.title}</span>
        </li>
      ))}
    </ul>
  );
}

function formatCohortStart(value: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    timeZone: "Asia/Tashkent",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
