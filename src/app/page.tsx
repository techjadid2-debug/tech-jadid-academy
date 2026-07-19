import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { ModuleIcon } from "@/components/course/ModuleIcon";
import { LessonCard } from "@/components/course/LessonCard";
import { AI_FOUNDATIONS, formatUzs } from "@/lib/course-data";
import { getCourseAsync } from "@/lib/course";
import { getCurrentUser } from "@/lib/auth";
import { getPublicCohortSummary } from "@/lib/cohorts";

const WHO_FOR = [
  { ico: "🎓", h: "Talaba", p: "Kod bilmasangiz ham muammo emas. AI'ni ishlatishni, prompt yozishni va birinchi mahsulotingizni qurishni o'rganasiz." },
  { ico: "💼", h: "Kasb egasi", p: "Marketolog, dizayner, o'qituvchi — istalgan sohada AI'ni ish jarayoningizga tatbiq etib, vaqtingizni tejaysiz." },
  { ico: "🚀", h: "Tadbirkor", p: "Vibe coding va AI bot orqali o'z mini-mahsulotingizni kod yozmasdan qurib, sinab ko'rasiz." },
];

const PORTFOLIO = [
  { color: "var(--blue)", n: "01", h: "Prompt kutubxonasi", p: "Kasbingizga moslangan qayta ishlatiladigan promptlar to'plami." },
  { color: "var(--red)", n: "02", h: "Media to'plami", p: "Rasm + video + ovoz — izchil uslubdagi vizual portfolio." },
  { color: "var(--yellow)", n: "03", h: "Vibe-coded app", p: "Internetda ishlaydigan, jonli URL bilan real asbob." },
  { color: "var(--green)", n: "04", h: "AI Telegram bot", p: "O'zingiz qurgan, ishlaydigan shaxsiy bot." },
  { color: "var(--blue)", n: "05", h: "AI workflow hujjati", p: "Kasbiy vazifani to'liq AI oqimiga aylantirilgan reja." },
  { color: "var(--red)", n: "06", h: "Namoyish sahifasi", p: "Barcha ishlaringizni jamlagan yakuniy portfolio." },
];

const FAQ = [
  { q: "Kod yozishni bilishim shartmi?", a: "Yo'q. Kurs \"vibe coding\" asosida — natijani AI'ga tasvirlab berasiz, kod AI tomonidan yoziladi. Boshlang'ich va tajribali ishtirokchilar bir xil darajada boshlaydi." },
  { q: "Har dars qancha davom etadi?", a: "75–90 daqiqa: qisqa nazariya, ustoz namoyishi, yo'nalish bo'yicha amaliyot va savol-javob. Har dars ko'rsatsa bo'ladigan natija bilan tugaydi." },
  { q: "Qaysi AI tool'lardan foydalanamiz?", a: "ChatGPT, Claude, Gemini, rasm/video generatorlar (Midjourney, Veo, Flux), vibe coding uchun Claude/Cursor/Bolt kabi zamonaviy vositalar. Bepul va pullik variantlar solishtiriladi." },
  { q: "Kurs oxirida nimaga ega bo'laman?", a: "6 ta real artefakt: prompt kutubxonasi, media to'plami, ishlaydigan vibe-coded app, AI Telegram bot, AI workflow hujjati va yakuniy portfolio sahifa." },
  { q: "Darsni o'tkazib yuborsam nima bo'ladi?", a: "Jadval va mavjud yozuvlar shaxsiy kabinetda ko'rinadi. Video yozuvi hali biriktirilmagan darslarda matnli materiallardan foydalanasiz; aniq qayta ko'rish tartibi guruh ochilishidan oldin ustoz bilan kelishiladi." },
  { q: "AI vositalari uchun alohida to'lov kerakmi?", a: "Kurs narxi tashqi AI servislarining pullik tariflarini o'z ichiga olmaydi. Darslarda bepul variantlar ko'rsatiladi, pullik vosita zarur bo'lsa xarajat oldindan aytiladi." },
  { q: "Sertifikat beriladimi?", a: "Sertifikat funksiyasi platformada bor, lekin berilish shartlari hali e'lon qilinmagan. Qaror qabul qilishdan oldin ustozdan aniq talablarni so'rang." },
];

export default async function LandingPage() {
  const [loadedCourse, user, cohort] = await Promise.all([
    getCourseAsync(AI_FOUNDATIONS.slug),
    getCurrentUser(),
    getPublicCohortSummary(AI_FOUNDATIONS.slug),
  ]);
  const course = loadedCourse ?? AI_FOUNDATIONS;
  const previewLesson = course.modules.flatMap((module) => module.lessons).find((lesson) => lesson.isPreview);

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
          <div className="eyebrow">Sun&apos;iy Intellekt Asoslari · {course.year}</div>
          <h1>
            Oddiy foydalanuvchidan —<br />
            <span className="grad">Super darajadagi mutaxassisga.</span>
          </h1>
          <p className="lead">
            2 oy davom etadigan kechki <b>Google Meet</b> darslari va 16 darslik platforma. Sun&apos;iy intellektni <b>tushuna</b> va{" "}
            <b>super darajada ishlata oladigan</b> mutaxassis bo&apos;lasiz. Kod yozmasdan prompt
            yozasiz, media generatsiya qilasiz va o&apos;z asbobingizni qurasiz.{" "}
            <b>Har dars ko&apos;rsatsa bo&apos;ladigan natija qoldiradi.</b>
          </p>
          <div className="stats">
            <div className="stat"><div className="num">16</div><div className="lbl">Dars</div></div>
            <div className="stat"><div className="num">2<small> oy</small></div><div className="lbl">Jonli guruh</div></div>
            <div className="stat"><div className="num">6</div><div className="lbl">Modul</div></div>
            <div className="stat"><div className="num">6</div><div className="lbl">Artefakt</div></div>
          </div>
          <div className="hero-cta">
            <Link href={user ? "/dashboard" : "/register"} className="btn btn-primary">{user ? "Kabinetga o'tish →" : "Ro'yxatdan o'tish →"}</Link>
            <Link href="/kurs/ai-asoslari" className="btn btn-ghost">Dasturni ko&apos;rish</Link>
            {previewLesson && <Link href={`/learn/${course.slug}/${previewLesson.order}`} className="btn btn-ghost">Bepul 1-dars</Link>}
          </div>
          <p className="hint" style={{ marginTop: 16 }}>
            {cohort ? `${cohort.title}: ${formatCohortStart(cohort.startsAt)} boshlanadi.` : "Yangi guruhning aniq kuni va vaqti to'lovdan oldin siz bilan kelishiladi."}
          </p>
        </section>

        <section className="course-format" aria-labelledby="format-title">
          <div className="format-inner">
            <div className="wf-eyebrow">Qanday o&apos;qiladi</div>
            <h2 id="format-title">Arizadan jonli darsgacha — tushunarli yo&apos;l.</h2>
            <div className="format-grid">
              <article><span>1</span><b>Hisob va ariza</b><p>Login va parolni o&apos;zingiz tanlaysiz. Kontakt orqali ustoz siz bilan bog&apos;lanadi.</p></article>
              <article><span>2</span><b>Guruh va to&apos;lov</b><p>Aniq sana, vaqt va tarif kelishiladi. Shundan keyin shaxsiy checkout tayyorlanadi.</p></article>
              <article><span>3</span><b>8 hafta amaliyot</b><p>Haftasiga 2 ta, 75–90 daqiqalik Google Meet darsi va platformadagi 16 dars.</p></article>
            </div>
            <p className="format-status">{cohort ? `Ochiq guruh: ${cohort.title} · ${formatCohortStart(cohort.startsAt)}` : "Hozircha ochiq guruh sanasi e'lon qilinmagan. Pul o'tkazishdan oldin jadvalni ustoz bilan tasdiqlang."}</p>
          </div>
        </section>

        {/* WHO FOR */}
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

        {/* MODULES */}
        {course.modules.map((m) => (
          <section
            key={m.order}
            className={`module${m.mist ? " mist" : ""}`}
            id={`m${m.order}`}
            style={{ ["--accent" as string]: `var(--${m.accent})` }}
          >
            <div className="m-inner">
              <div className="m-head">
                <ModuleIcon order={m.order} />
                <div className="m-num">{m.code}</div>
                <h2 className="m-title">{m.title}</h2>
                <div className="m-range">{m.range}</div>
              </div>
              <div className={`lessons${m.lessons.length === 2 ? " solo" : ""}`}>
                {m.lessons.map((l) => (
                  <LessonCard
                    key={l.order}
                    lesson={l}
                    reveal
                    unlocked={l.isPreview}
                    href={l.isPreview ? `/learn/${course.slug}/${l.order}` : undefined}
                  />
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* NARX / QIYMAT */}
        <section className="pricing" id="narx">
          <h2>Qatnashish</h2>
          <p className="sub">Ariza yuboring — ustoz aloqaga chiqadi. To&apos;lov tasdiqlangach guruh va 8 haftalik dars jadvali ochiladi.</p>
          <div className="price-grid">
            {course.pricing.map((p) => (
              <div key={p.kind} className={`price-card${p.kind === "lifetime" ? " featured" : ""}`}>
                {p.kind === "lifetime" && <div className="price-badge">Ommabop</div>}
                <div className="price-label">{p.label}</div>
                <div className="price-amount">
                  {formatUzs(p.priceUzs)}
                  {p.kind === "monthly" && <small> / oy</small>}
                </div>
                <p className="price-note">{p.note}</p>
                <Link
                  href={user ? "/dashboard" : "/register"}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {user ? "Kabinetga o'tish" : "Ro'yxatdan o'tish"}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* INSTRUCTOR */}
        <section className="instructor">
          <div className="in-wrap">
            <div className="in-avatar">AV</div>
            <div>
              <div className="in-eyebrow">Kursni kim o&apos;tadi</div>
              <div className="in-name">Abdulvosit</div>
              <p className="in-role">
                AI Engineer &amp; Robototexnika mutaxassisi · Tech Jadid asoschisi. FastAPI, pgvector
                va LLM asosida real AI mahsulotlar quradi (ChaqimchiAI va boshqalar), shu bilan birga
                o&apos;zbek tilida amaliy AI ta&apos;limini rivojlantiradi.
              </p>
              <div className="in-stats">
                <div className="in-stat"><b>120+</b><span>Obunachi</span></div>
                <div className="in-stat"><b>16</b><span>Amaliy dars</span></div>
                <div className="in-stat"><b>Najot Ta&apos;lim</b><span>Hamkor</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* PORTFOLIO */}
        <section className="portfolio" id="portfolio">
          <div className="p-inner">
            <div className="p-eyebrow">Kurs oxirida qo&apos;lingizda</div>
            <h2>&quot;Kurs o&apos;tdim&quot; emas — ko&apos;rsatadigan 6 mahsulot.</h2>
            <p className="sub">
              Har modul bitta real artefakt qoldiradi. Kurs tugaganda mijoz yoki ish beruvchiga
              ko&apos;rsatsa bo&apos;ladigan to&apos;liq portfolio bo&apos;ladi.
            </p>
            <div className="p-grid">
              {PORTFOLIO.map((p) => (
                <div className="p-item" key={p.n}>
                  <div className="p-dot" style={{ background: p.color }}>{p.n}</div>
                  <h4>{p.h}</h4>
                  <p>{p.p}</p>
                </div>
              ))}
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
          <p>{cohort ? `${cohort.title} ${formatCohortStart(cohort.startsAt)} boshlanadi.` : "Guruh sanasi hali e'lon qilinmagan. Ariza qoldiring — aniq jadval va tarif to'lovdan oldin kelishiladi."}</p>
          <Link href={user ? "/dashboard" : "/register"} className="btn btn-primary">{user ? "Kabinetga o'tish →" : "Ro'yxatdan o'tish →"}</Link>
        </section>
      </main>
      <SiteFooter />
    </>
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
