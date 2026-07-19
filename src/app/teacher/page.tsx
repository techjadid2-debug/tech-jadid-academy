import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { getCurrentUser } from "@/lib/auth";
import { isTeacher, listTeacherCohorts } from "@/lib/cohorts";
import { AI_FOUNDATIONS } from "@/lib/course-data";
import { listActionableRequests } from "@/lib/enrollment-requests";
import { approveManualPayment, createCohort, prepareApplicationPayment } from "./actions";
import { getPendingPaymentForRequest } from "@/lib/payments/db";

export default async function TeacherPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; order?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/teacher");
  if (!isTeacher(user)) redirect("/dashboard");
  const [{ saved, error, order }, cohorts, requests] = await Promise.all([
    searchParams,
    listTeacherCohorts(user, AI_FOUNDATIONS.slug),
    listActionableRequests(AI_FOUNDATIONS.slug),
  ]);
  const paymentByRequest = new Map((await Promise.all(requests.map(async (request) => [request.id, await getPendingPaymentForRequest(request.id)] as const))).filter((entry) => entry[1]));

  return (
    <>
      <SiteNav links={[]} cta={{ href: "/dashboard", label: "Kabinet" }} />
      <main className="shell">
        <div className="teacher-heading">
          <div>
            <div className="page-eyebrow">Ustoz kabineti</div>
            <h1 className="page-title">Jonli guruhlar</h1>
            <p className="page-sub">Jadval, arizalar, to&apos;lov, darslar va o&apos;quvchi natijalarini bitta joydan boshqaring.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/admin/homework" className="btn btn-ghost">Uy vazifalari</Link>
            {user.role === "admin" && <Link href="/admin" className="btn btn-ghost">Admin CMS</Link>}
          </div>
        </div>

        {saved && <Notice tone="success">✓ Amal bajarildi.</Notice>}
        {error && <Notice tone="error">⚠️ Amal bajarilmadi. Ma&apos;lumotlarni tekshirib qayta urining.</Notice>}
        {order && (
          <Notice tone="success">
            To&apos;lov buyurtmasi tayyor: <Link href={`/checkout?order=${order}`}>o&apos;quvchi checkout havolasi</Link>
          </Notice>
        )}

        <section className="teacher-grid" style={{ marginBottom: 24 }}>
          {cohorts.map((cohort) => (
            <Link href={`/teacher/${cohort.id}`} className="panel teacher-cohort-card" key={cohort.id}>
              <div className="teacher-card-top">
                <span className={`badge ${cohort.status === "active" ? "badge-green" : "badge-blue"}`}>{cohort.status}</span>
                <span className="hint">{cohort.studentCount} o&apos;quvchi</span>
              </div>
              <h2>{cohort.title}</h2>
              <p className="hint">{formatDate(cohort.startsAt)} — {formatDate(cohort.endsAt)}</p>
            </Link>
          ))}
          {cohorts.length === 0 && <div className="panel"><b>Hali jonli guruh yo&apos;q</b><p className="hint" style={{ marginTop: 8 }}>Birinchi guruhni quyidagi forma orqali yarating.</p></div>}
        </section>

        <section className="panel" style={{ marginBottom: 24 }}>
          <b>Yangi 8 haftalik guruh</b>
          <p className="hint" style={{ margin: "8px 0 16px" }}>16 dars haftasiga ikki martadan avtomatik jadval qilinadi. Har dars materiali jonli sessiyadan 24 soat oldin ochiladi.</p>
          <form action={createCohort} className="teacher-form-grid">
            <div className="field"><label>Guruh nomi</label><input name="title" placeholder="AI Super Kurs · Avgust 2026" required /></div>
            <div className="field"><label>1-jonli dars vaqti</label><input name="startsAt" type="datetime-local" required /></div>
            <div className="field"><label>Telegram guruh havolasi</label><input name="telegramUrl" type="url" placeholder="https://t.me/..." /></div>
            <button className="btn btn-primary" type="submit">Guruh va jadvalni yaratish</button>
          </form>
        </section>

        <section className="panel" id="applications">
          <b>Qabul va to&apos;lov ({requests.length})</b>
          <p className="hint" style={{ margin: "8px 0 16px" }}>Arizani guruh va tarifga bog&apos;lang. O&apos;quvchi checkout orqali chek yuboradi; tasdiqdan keyingina kurs ochiladi.</p>
          {requests.length === 0 ? <p className="hint">Faol arizalar yo&apos;q.</p> : (
            <div className="teacher-applications">
              {requests.map((request) => (
                <div key={request.id} className="teacher-application-row">
                  <div>
                    <b>{request.fullName ?? "Noma'lum"} {request.login && <span className="hint">@{request.login}</span>}</b>
                    <p className="hint">{request.contact ?? "kontakt yo'q"} · {statusLabel(request.status)}</p>
                  </div>
                  {request.status === "payment_pending" ? (
                    <div className="teacher-payment-form">
                      <span className="badge badge-green">Checkout tayyor</span>
                      {paymentByRequest.get(request.id) && <>
                        <Link href={`/checkout?order=${paymentByRequest.get(request.id)!.id}`} className="btn btn-ghost">Checkout</Link>
                        <form action={approveManualPayment}>
                          <input type="hidden" name="paymentId" value={paymentByRequest.get(request.id)!.id} />
                          <button className="btn btn-primary">Chekni tasdiqlash</button>
                        </form>
                      </>}
                    </div>
                  ) : (
                    <form action={prepareApplicationPayment} className="teacher-payment-form">
                      <input type="hidden" name="requestId" value={request.id} />
                      <select name="cohortId" required defaultValue="">
                        <option value="" disabled>Guruhni tanlang</option>
                        {cohorts.filter((cohort) => cohort.status !== "completed").map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.title}</option>)}
                      </select>
                      <select name="kind" defaultValue="lifetime"><option value="lifetime">Bir martalik</option><option value="monthly">Oyma-oy</option></select>
                      <button type="submit" className="btn btn-primary" disabled={cohorts.length === 0}>Checkout tayyorlash</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Notice({ children, tone }: { children: React.ReactNode; tone: "success" | "error" }) {
  return <div className="panel" style={{ marginBottom: 16, background: `color-mix(in srgb, var(--${tone === "success" ? "green" : "red"}) 9%, var(--card-bg))` }}>{children}</div>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("uz-UZ", { timeZone: "Asia/Tashkent", day: "2-digit", month: "short", year: "numeric" });
}

function statusLabel(status: string) {
  if (status === "contacted") return "aloqaga olindi";
  if (status === "payment_pending") return "to'lov kutilmoqda";
  return "yangi ariza";
}
