import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { LeadForm } from "@/components/LeadForm";
import { CatalogCover } from "@/components/course/CatalogCover";
import { COURSES, allLessons, formatUzs } from "@/lib/course-data";
import { getCourseAsync } from "@/lib/course";
import { getCurrentUser } from "@/lib/auth";
import { getPublicCohortSummary } from "@/lib/cohorts";

const STEPS = [
  {
    n: "01",
    title: "Kursni tanlang",
    text: "Dastur va bepul birinchi darsni ko'rib, o'zingizga mos yo'nalishni tanlang.",
  },
  {
    n: "02",
    title: "Raqamingizni qoldiring",
    text: "Sotuvchi sizga telefon qilib, jadval, narx va barcha savollaringizni tushuntiradi.",
  },
  {
    n: "03",
    title: "Kursni boshlang",
    text: "To'lov tasdiqlangach login va parol olasiz, kurs darhol kabinetingizda ochiladi.",
  },
];

const FAQ = [
  {
    q: "Kod yozishni bilishim kerakmi?",
    a: "Yo'q. AI Video Creator uchun kod kerak emas. AI Builder'da kodni AI yozadi, siz esa vazifani to'g'ri tushuntirish va natijani tekshirishni o'rganasiz.",
  },
  {
    q: "Darslar qanday o'tadi?",
    a: "Kurs 2 oy davom etadi. Kechki jonli Google Meet darslari va 16 darslik platforma birga ishlaydi.",
  },
  {
    q: "To'lovdan oldin kim bilan gaplashaman?",
    a: "Formada telefoningizni qoldiring. Sotuvchi sizga qo'ng'iroq qilib, guruh sanasi, tarif va to'lov tartibini tushuntiradi.",
  },
  {
    q: "Birinchi dars haqiqatan bepulmi?",
    a: "Ha. Har ikki kursning 1-darsini hisob ochmasdan ko'rishingiz mumkin.",
  },
];

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const [{ course: requestedCourse }, user] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);
  const cards = await Promise.all(
    COURSES.map(async (base) => {
      const [loaded, cohort] = await Promise.all([
        getCourseAsync(base.slug),
        getPublicCohortSummary(base.slug),
      ]);
      const course = loaded ?? base;
      const lessons = allLessons(course);
      const preview = lessons.find((lesson) => lesson.isPreview) ?? lessons[0];
      const price = course.pricing.find((plan) => plan.kind === "lifetime") ?? course.pricing[0];
      return { course, lessons, preview, price, cohort };
    }),
  );
  const defaultCourseSlug = cards.some((card) => card.course.slug === requestedCourse)
    ? requestedCourse!
    : cards[0].course.slug;
  const leadCourses = cards.map(({ course, preview }) => ({
    slug: course.slug,
    title: course.title,
    previewHref: `/learn/${course.slug}/${preview.order}`,
  }));

  return (
    <>
      <SiteNav
        links={[
          { href: "/#kurslar", label: "Kurslar" },
          { href: "/#bepul-darslar", label: "Bepul 1-dars" },
          { href: "/#jarayon", label: "Qanday ishlaydi" },
        ]}
        cta={
          user
            ? { href: user.role === "seller" ? "/sotuvchi" : "/dashboard", label: "Kabinet" }
            : { href: "/#lead", label: "Qo'ng'iroq so'rash" }
        }
        secondaryCta={!user ? { href: "/login", label: "Kirish" } : undefined}
      />
      <main id="top">
        <section className="hero compact-hero">
          <div className="eyebrow">Tech Jadid akademiyasi · Jonli + platforma</div>
          <h1>
            AI&apos;ni tomosha qilmang.<br />
            <span className="grad">Amalda ishlating.</span>
          </h1>
          <p className="lead">
            Ikki amaliy yo&apos;nalish: AI bilan professional video yarating yoki
            website, Telegram bot va AI agentdan iborat ishlaydigan mahsulot quring.
          </p>
          <div className="hero-proof">
            <span>16 dars</span>
            <span>2 oy</span>
            <span>Jonli Google Meet</span>
            <span>Bepul 1-dars</span>
          </div>
          <div className="hero-cta">
            <Link href="#lead" className="btn btn-primary">Qo&apos;ng&apos;iroq so&apos;rash</Link>
            <Link href="#bepul-darslar" className="btn btn-ghost">Bepul 1-darsni ko&apos;rish →</Link>
          </div>
        </section>

        <section className="compact-courses" id="kurslar" aria-labelledby="courses-title">
          <div className="compact-section-head">
            <div className="page-eyebrow">Ikki yo&apos;nalish</div>
            <h2 id="courses-title">O&apos;zingizga mos kursni tanlang</h2>
            <p>Har bir kurs mustaqil. Birini tanlaysiz va natijaga olib boradigan 16 darslik yo&apos;lni bosib o&apos;tasiz.</p>
          </div>
          <div className="course-catalog-grid" id="bepul-darslar">
            {cards.map(({ course, lessons, preview, price, cohort }) => (
              <article className="panel course-catalog-card compact-course-card" key={course.slug}>
                <CatalogCover slug={course.slug} />
                <div className="page-eyebrow">{course.title}</div>
                <h3>{course.title}</h3>
                <p className="compact-course-subtitle">{course.subtitle}</p>
                <div className="compact-course-facts">
                  <span>{lessons.length} dars</span>
                  <span>{course.modules.length} modul</span>
                  <span>2 oy</span>
                </div>
                <div className="compact-course-result">
                  <b>Kurs natijasi</b>
                  <p>{preview.rows.find((row) => row.kind === "Natija")?.text ?? preview.title}</p>
                </div>
                <div className="compact-course-bottom">
                  <div>
                    <strong>{formatUzs(price.priceUzs)}</strong>
                    <span>{cohort ? `${formatCohortDate(cohort.startsAt)} boshlanadi` : "Guruh sanasi qo'ng'iroqda kelishiladi"}</span>
                  </div>
                  <div className="catalog-actions">
                    <Link
                      href={`/learn/${course.slug}/${preview.order}`}
                      className="btn btn-primary"
                    >
                      Bepul 1-dars
                    </Link>
                    <Link
                      href={`/?course=${encodeURIComponent(course.slug)}#lead`}
                      className="btn btn-ghost"
                    >
                      Qo&apos;ng&apos;iroq so&apos;rash
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="lead-section" id="lead" aria-labelledby="lead-title">
          <div className="lead-section-copy">
            <div className="page-eyebrow">Savolingiz bormi?</div>
            <h2 id="lead-title">Raqamingizni qoldiring — o&apos;zimiz qo&apos;ng&apos;iroq qilamiz</h2>
            <p>
              Qaysi kurs mosligi, dars vaqti, narx va to&apos;lov tartibini oddiy tilda
              tushuntiramiz. Forma hech qanday to&apos;lov majburiyatini yuklamaydi.
            </p>
            <ul>
              <li>Jadval va guruh sanasini bilib olasiz</li>
              <li>Kurslar farqini sotuvchidan so&apos;raysiz</li>
              <li>Qaror qilgachgina to&apos;lov qilasiz</li>
            </ul>
          </div>
          <div className="panel lead-form-card">
            <LeadForm courses={leadCourses} defaultCourseSlug={defaultCourseSlug} />
          </div>
        </section>

        <section className="process-section" id="jarayon" aria-labelledby="process-title">
          <div className="compact-section-head">
            <div className="page-eyebrow">Uchta oddiy qadam</div>
            <h2 id="process-title">Kursga kirish qanday ochiladi?</h2>
          </div>
          <div className="process-grid">
            {STEPS.map((step) => (
              <article key={step.n}>
                <span>{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="faq compact-faq">
          <div className="faq-eyebrow">Qisqa javoblar</div>
          <h2>Ko&apos;p so&apos;raladigan savollar</h2>
          {FAQ.map((item, index) => (
            <details className="faq-item" key={item.q} open={index === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function formatCohortDate(value: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    timeZone: "Asia/Tashkent",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}
