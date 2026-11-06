import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { getCurrentUser, isSeller } from "@/lib/auth";
import { COURSES, formatUzs } from "@/lib/course-data";
import { listSellerAccounts } from "@/lib/sellers";
import {
  getSalesDashboardStats,
  listSalesLeads,
  SALES_LEAD_STATUSES,
  SALES_LEAD_STATUS_LABELS,
  type SalesLeadStatus,
} from "@/lib/sales-leads";
import { claimLead } from "./actions";

export default async function SellerPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    seller?: string;
    course?: string;
    q?: string;
    error?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/sotuvchi");
  if (!isSeller(user)) redirect("/dashboard");
  const params = await searchParams;
  const status = SALES_LEAD_STATUSES.includes(params.status as SalesLeadStatus)
    ? (params.status as SalesLeadStatus)
    : undefined;
  const assignedTo =
    params.seller === "mine"
      ? user.id
      : params.seller === "unassigned"
        ? "unassigned"
        : params.seller || undefined;

  const [{ available, leads }, stats, sellers] = await Promise.all([
    listSalesLeads({
      status,
      assignedTo,
      courseSlug: params.course,
      query: params.q,
    }),
    getSalesDashboardStats(),
    listSellerAccounts(),
  ]);

  return (
    <>
      <SiteNav
        links={[]}
        cta={{ href: user.role === "admin" ? "/admin" : "/", label: user.role === "admin" ? "Admin panel" : "Bosh sahifa" }}
      />
      <main className="shell">
        <div className="teacher-heading">
          <div>
            <div className="page-eyebrow">Call-center CRM</div>
            <h1 className="page-title">Sotuv leadlari</h1>
            <p className="page-sub">
              Yangi murojaatni o&apos;zingizga oling, qo&apos;ng&apos;iroq natijasini yozing va
              to&apos;lovdan keyin kursni shu yerning o&apos;zida oching.
            </p>
          </div>
          <Link href="/sotuvchi?seller=mine" className="btn btn-primary">
            Mening leadlarim
          </Link>
        </div>

        {params.error && (
          <div className="panel teacher-notice teacher-notice-error" role="alert">
            ⚠️ Leadni olishning iloji bo&apos;lmadi. Uni boshqa sotuvchi olgan bo&apos;lishi mumkin.
          </div>
        )}
        {!available && (
          <div className="panel teacher-notice teacher-notice-error" role="alert">
            ⚠️ CRM bazasi tayyor emas. `0017_sales_crm.sql` migratsiyasini qo&apos;llang.
          </div>
        )}

        <section className="crm-stats" aria-label="Sotuv ko'rsatkichlari">
          <CrmStat label="Bugungi leadlar" value={stats.newToday} accent="blue" />
          <CrmStat label="Biriktirilmagan" value={stats.unassigned} accent="yellow" />
          <CrmStat label="Follow-up muddati kelgan" value={stats.followUpDue} accent="red" />
          <CrmStat label="Shu oy to'langan" value={stats.paidThisMonth} accent="green" />
        </section>

        <form className="panel crm-filters" method="get">
          <div className="field">
            <label htmlFor="crm-q">Qidirish</label>
            <input id="crm-q" name="q" defaultValue={params.q} placeholder="Ism yoki telefon" />
          </div>
          <div className="field">
            <label htmlFor="crm-status">Holat</label>
            <select id="crm-status" name="status" defaultValue={params.status ?? ""}>
              <option value="">Barcha holatlar</option>
              {SALES_LEAD_STATUSES.map((item) => (
                <option key={item} value={item}>{SALES_LEAD_STATUS_LABELS[item]}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="crm-seller">Sotuvchi</label>
            <select id="crm-seller" name="seller" defaultValue={params.seller ?? ""}>
              <option value="">Barcha sotuvchilar</option>
              <option value="mine">Mening leadlarim</option>
              <option value="unassigned">Biriktirilmagan</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>{seller.fullName}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="crm-course">Kurs</label>
            <select id="crm-course" name="course" defaultValue={params.course ?? ""}>
              <option value="">Barcha kurslar</option>
              {COURSES.map((course) => (
                <option key={course.slug} value={course.slug}>{course.title}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" type="submit">Filtrlash</button>
          <Link href="/sotuvchi" className="btn btn-ghost">Tozalash</Link>
        </form>

        <section className="panel crm-list-panel">
          <div className="crm-list-heading">
            <div>
              <b>Leadlar</b>
              <p className="hint">{leads.length} ta natija</p>
            </div>
          </div>
          {leads.length === 0 ? (
            <div className="crm-empty">
              <span aria-hidden="true">📞</span>
              <b>Hozircha lead yo&apos;q</b>
              <p>Yangi murojaatlar bosh sahifadagi formadan shu yerga tushadi.</p>
            </div>
          ) : (
            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Mijoz</th>
                    <th>Kurs</th>
                    <th>Holat</th>
                    <th>Sotuvchi</th>
                    <th>Keldi</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <Link href={`/sotuvchi/leads/${lead.id}`} className="crm-customer-link">
                          {lead.fullName}
                        </Link>
                        <a href={`tel:${lead.phone}`} className="hint crm-phone">{lead.phone}</a>
                        {lead.resubmissionCount > 0 && (
                          <span className="badge badge-blue">Qayta: {lead.resubmissionCount}</span>
                        )}
                      </td>
                      <td>{lead.courseTitle}</td>
                      <td>
                        <span className={`badge crm-status crm-status-${lead.status}`}>
                          {SALES_LEAD_STATUS_LABELS[lead.status]}
                        </span>
                        {lead.status === "paid" && lead.amountUzs && (
                          <span className="hint crm-paid-amount">{formatUzs(lead.amountUzs)}</span>
                        )}
                      </td>
                      <td>{lead.assignedName ?? <span className="hint">Navbatda</span>}</td>
                      <td>
                        <time dateTime={lead.lastSubmittedAt}>{formatDateTime(lead.lastSubmittedAt)}</time>
                      </td>
                      <td>
                        {lead.assignedTo ? (
                          <Link href={`/sotuvchi/leads/${lead.id}`} className="btn btn-ghost crm-row-button">
                            Ochish
                          </Link>
                        ) : lead.status !== "paid" && lead.status !== "lost" ? (
                          <form action={claimLead}>
                            <input type="hidden" name="leadId" value={lead.id} />
                            <button className="btn btn-primary crm-row-button" type="submit">
                              O&apos;zimga olish
                            </button>
                          </form>
                        ) : (
                          <Link href={`/sotuvchi/leads/${lead.id}`} className="btn btn-ghost crm-row-button">
                            Ko&apos;rish
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function CrmStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "blue" | "yellow" | "red" | "green";
}) {
  return (
    <article className="panel crm-stat" style={{ ["--crm-accent" as string]: `var(--${accent})` }}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
