import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { getCurrentUser, isSeller } from "@/lib/auth";
import { getCourseAsync } from "@/lib/course";
import { formatUzs } from "@/lib/course-data";
import { listSellerAccounts } from "@/lib/sellers";
import {
  getSalesLead,
  SALES_LEAD_STATUSES,
  SALES_LEAD_STATUS_LABELS,
} from "@/lib/sales-leads";
import { canEditSalesLead } from "@/lib/sales-lead-validation";
import {
  addLeadNote,
  assignLead,
  claimLead,
  resetOwnedStudentPassword,
  saveLeadDetails,
} from "@/app/sotuvchi/actions";
import { SaleForm } from "./SaleForm";

export default async function SalesLeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ leadId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/sotuvchi");
  if (!isSeller(user)) redirect("/dashboard");
  const [{ leadId }, message] = await Promise.all([params, searchParams]);
  const [lead, sellers] = await Promise.all([
    getSalesLead(leadId),
    user.role === "admin" ? listSellerAccounts() : Promise.resolve([]),
  ]);
  if (!lead) notFound();
  const course = await getCourseAsync(lead.courseSlug);
  const canEdit = canEditSalesLead(user, lead);
  const plans = (course?.pricing ?? [])
    .filter((plan): plan is typeof plan & { kind: "lifetime" | "monthly" } =>
      plan.kind === "lifetime" || plan.kind === "monthly")
    .map((plan) => ({ kind: plan.kind, label: plan.label, priceUzs: plan.priceUzs }));

  return (
    <>
      <SiteNav
        links={[{ href: "/sotuvchi", label: "← Barcha leadlar" }]}
        cta={{ href: user.role === "admin" ? "/admin" : "/", label: user.role === "admin" ? "Admin panel" : "Bosh sahifa" }}
      />
      <main className="shell">
        <div className="crm-detail-heading">
          <div>
            <div className="page-eyebrow">{lead.courseTitle}</div>
            <h1 className="page-title">{lead.fullName}</h1>
            <div className="crm-detail-meta">
              <a href={`tel:${lead.phone}`}>{lead.phone}</a>
              <span className={`badge crm-status crm-status-${lead.status}`}>
                {SALES_LEAD_STATUS_LABELS[lead.status]}
              </span>
              <span className="hint">Lead: {formatDateTime(lead.createdAt)}</span>
            </div>
          </div>
          {!lead.assignedTo && lead.status !== "paid" && lead.status !== "lost" && (
            <form action={claimLead}>
              <input type="hidden" name="leadId" value={lead.id} />
              <button className="btn btn-primary" type="submit">O&apos;zimga olish</button>
            </form>
          )}
        </div>

        {message.saved && (
          <div className="panel teacher-notice" role="status">✓ Ma&apos;lumot saqlandi.</div>
        )}
        {message.error && (
          <div className="panel teacher-notice teacher-notice-error" role="alert">
            ⚠️ Amal bajarilmadi. Maydonlar yoki ruxsatni tekshiring.
          </div>
        )}

        <div className="crm-detail-grid">
          <div className="crm-detail-main">
            <section className="panel">
              <div className="crm-section-heading">
                <div>
                  <div className="page-eyebrow">Mijoz kartasi</div>
                  <h2>Aloqa va sotuv holati</h2>
                </div>
                <span className="badge badge-gray">
                  {lead.assignedName ? `Sotuvchi: ${lead.assignedName}` : "Biriktirilmagan"}
                </span>
              </div>

              {user.role === "admin" && lead.status !== "paid" && (
                <form action={assignLead} className="crm-assign-form">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <select name="sellerId" defaultValue={lead.assignedTo ?? ""}>
                    <option value="">Umumiy navbat</option>
                    {sellers.map((seller) => (
                      <option key={seller.id} value={seller.id}>{seller.fullName}</option>
                    ))}
                  </select>
                  <button type="submit" className="btn btn-ghost">Biriktirish</button>
                </form>
              )}

              {canEdit && lead.status !== "paid" ? (
                <form action={saveLeadDetails} className="crm-details-form">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <div className="admin-account-grid">
                    <div className="field">
                      <label htmlFor="detail-name">Ism</label>
                      <input id="detail-name" name="fullName" defaultValue={lead.fullName} required />
                    </div>
                    <div className="field">
                      <label htmlFor="detail-phone">Asosiy telefon</label>
                      <input id="detail-phone" name="phone" defaultValue={lead.phone} required />
                    </div>
                    <div className="field">
                      <label htmlFor="detail-secondary">Ikkinchi telefon</label>
                      <input id="detail-secondary" name="secondaryPhone" defaultValue={lead.secondaryPhone ?? ""} />
                    </div>
                    <div className="field">
                      <label htmlFor="detail-age">Yoshi</label>
                      <input id="detail-age" name="age" type="number" min={12} max={100} defaultValue={lead.age ?? ""} />
                    </div>
                    <div className="field">
                      <label htmlFor="detail-status">Holat</label>
                      <select id="detail-status" name="status" defaultValue={lead.status}>
                        {SALES_LEAD_STATUSES.filter((status) => status !== "paid").map((status) => (
                          <option key={status} value={status}>{SALES_LEAD_STATUS_LABELS[status]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="detail-follow-up">Keyingi qo&apos;ng&apos;iroq</label>
                      <input
                        id="detail-follow-up"
                        name="nextFollowUpAt"
                        type="datetime-local"
                        defaultValue={toTashkentInput(lead.nextFollowUpAt)}
                      />
                      <span className="hint">“Qayta qo&apos;ng&apos;iroq” holatida vaqt majburiy.</span>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="detail-info">Qo&apos;shimcha ma&apos;lumot</label>
                    <textarea id="detail-info" name="extraInfo" rows={5} defaultValue={lead.extraInfo ?? ""} />
                  </div>
                  <button className="btn btn-primary" type="submit">Ma&apos;lumotni saqlash</button>
                </form>
              ) : (
                <dl className="crm-readonly-details">
                  <div><dt>Asosiy telefon</dt><dd><a href={`tel:${lead.phone}`}>{lead.phone}</a></dd></div>
                  <div><dt>Ikkinchi telefon</dt><dd>{lead.secondaryPhone ?? "—"}</dd></div>
                  <div><dt>Yoshi</dt><dd>{lead.age ?? "—"}</dd></div>
                  <div><dt>Qo&apos;shimcha ma&apos;lumot</dt><dd>{lead.extraInfo ?? "—"}</dd></div>
                  {lead.amountUzs && <div><dt>To&apos;lov</dt><dd>{formatUzs(lead.amountUzs)}</dd></div>}
                  {lead.customerLogin && <div><dt>O&apos;quvchi logini</dt><dd>{lead.customerLogin}</dd></div>}
                </dl>
              )}
            </section>

            <section className="panel">
              <div className="page-eyebrow">Izohlar</div>
              <h2>Qo&apos;ng&apos;iroq va suhbat qaydlari</h2>
              <form action={addLeadNote} className="crm-note-form">
                <input type="hidden" name="leadId" value={lead.id} />
                <textarea name="body" rows={4} placeholder="Mijoz nima dedi, nimaga qiziqdi, qachon qo'ng'iroq qilish kerak…" required />
                <button className="btn btn-primary" type="submit">Izoh qo&apos;shish</button>
              </form>
              <div className="crm-timeline">
                {lead.activities.length === 0 ? (
                  <p className="hint">Hali faoliyat yozuvi yo&apos;q.</p>
                ) : lead.activities.map((activity) => (
                  <article key={activity.id}>
                    <span className="crm-timeline-dot" />
                    <div>
                      <div className="crm-timeline-top">
                        <b>{activityTitle(activity.activityType)}</b>
                        <time dateTime={activity.createdAt}>{formatDateTime(activity.createdAt)}</time>
                      </div>
                      {activity.body && <p>{activity.body}</p>}
                      {activity.actorName && <span className="hint">{activity.actorName}</span>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="crm-detail-aside">
            {canEdit && lead.status !== "paid" ? (
              <section className="panel">
                <div className="page-eyebrow">Sotuvni yakunlash</div>
                <h2>To&apos;lov va kurs kirishi</h2>
                <p className="hint crm-aside-copy">
                  To&apos;lov tasdiqlangach o&apos;quvchi hisobi, to&apos;lov qaydi va kurs kirishi birga yaratiladi.
                </p>
                <SaleForm leadId={lead.id} plans={plans} />
              </section>
            ) : lead.status === "paid" ? (
              <section className="panel crm-paid-card">
                <span className="crm-paid-icon">✓</span>
                <h2>To&apos;lov yakunlangan</h2>
                <p>{lead.amountUzs ? formatUzs(lead.amountUzs) : "To'lov saqlandi"}</p>
                {lead.customerLogin && <code>{lead.customerLogin}</code>}
                {lead.customerUserId && (
                  <form action={resetOwnedStudentPassword} className="crm-password-form">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="studentId" value={lead.customerUserId} />
                    <div className="field">
                      <label htmlFor="reset-password">Yangi vaqtinchalik parol</label>
                      <input id="reset-password" name="password" type="password" minLength={8} required />
                    </div>
                    <button className="btn btn-ghost" type="submit">Parolni yangilash</button>
                  </form>
                )}
              </section>
            ) : (
              <section className="panel">
                <h2>Lead biriktirilmagan</h2>
                <p className="hint crm-aside-copy">To&apos;lovni yakunlash uchun avval leadni o&apos;zingizga oling.</p>
              </section>
            )}
            <Link href="/sotuvchi" className="btn btn-ghost crm-back-link">← Barcha leadlar</Link>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    timeZone: "Asia/Tashkent",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toTashkentInput(value: string | null) {
  if (!value) return "";
  return new Date(new Date(value).getTime() + 5 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);
}

function activityTitle(type: string) {
  const titles: Record<string, string> = {
    created: "Yangi lead",
    resubmitted: "Qayta murojaat",
    resubmitted_paid: "To'langan mijoz qayta murojaat qildi",
    claimed: "Sotuvchiga biriktirildi",
    reassigned: "Qayta biriktirildi",
    updated: "Ma'lumot yangilandi",
    status_changed: "Holat o'zgardi",
    note: "Izoh",
    payment_completed: "To'lov tasdiqlandi",
    account_opened: "Kurs ochildi",
  };
  return titles[type] ?? "Faoliyat";
}
