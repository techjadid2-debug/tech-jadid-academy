import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { formatUzs } from "@/lib/course-data";
import { getCourseAsync } from "@/lib/course";
import { env, isManualSalesConfigured } from "@/lib/env";

const PLAN_LABELS: Record<string, string> = {
  monthly: "Oyma-oy to'lash (1-oy)",
  installment2: "2 bo'lib to'lash",
  lifetime: "Bir martalik to'lov",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; kind?: string; step?: string }>;
}) {
  const sp = await searchParams;
  const slug = sp.slug ?? "";
  const course = await getCourseAsync(slug);
  if (!course) redirect("/");

  const kind = sp.kind && sp.kind in PLAN_LABELS ? sp.kind : "lifetime";
  const step = sp.step === "2" ? "2" : "1";
  const option = course.pricing.find((pricing) => pricing.kind === kind) ?? course.pricing[0];
  if (!option) redirect(`/kurs/${slug}`);
  const planLabel = kind === "installment2" ? `${PLAN_LABELS[kind]} (${step === "2" ? "2-qism" : "1-qism"})` : PLAN_LABELS[kind];
  const displayAmount = option.priceUzs;

  return (
    <>
      <SiteNav cta={{ href: "/dashboard", label: "Kabinet" }} />
      <main className="shell-narrow">
        <div className="page-eyebrow">To&apos;lov</div>
        <h1 className="page-title">Buyurtmani tasdiqlang</h1>
        <p className="page-sub">Quyidagi ma&apos;lumotlarni tekshiring va karta o&apos;tkazmasini yakunlang.</p>

        <div className="panel">
          <Row label="Kurs" value={course.title} />
          <div className="divider" />
          <Row label="Tarif" value={planLabel} />
          <div className="divider" />
          <Row label="To'lov usuli" value="Karta o'tkazmasi" />
          <div className="divider" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600 }}>Jami</span>
            <span style={{ fontWeight: 700, fontSize: 22 }}>{formatUzs(displayAmount)}</span>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 16, background: "color-mix(in srgb, var(--blue) 8%, var(--card-bg))" }}>
          {isManualSalesConfigured ? (
            <>
              <p className="hint">Kartaga o&apos;tkazing. So&apos;ng chek, ism va Telegram username&apos;ingizni yuboring. To&apos;lov tasdiqlangach siz jonli Telegram guruhiga qo&apos;shilasiz, login va parol bilan platforma ham ochiladi.</p>
              <div style={{ fontWeight: 700, marginTop: 12 }}>{env.paymentCardNumber}</div>
              <div className="hint">{env.paymentCardHolder}</div>
              <a href={env.paymentTelegramUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
                Chekni Telegram&apos;da yuborish
              </a>
            </>
          ) : <p className="hint">To&apos;lov rekvizitlari hali sozlanmagan. Admin bilan bog&apos;laning.</p>}
        </div>
        <p className="hint" style={{ margin: "14px 4px 0", textAlign: "center" }}>
          Kurs 2 oy davom etadi. Kechki Google Meet darslari, platformadagi slaydlar, amaliy topshiriqlar va mavzulararo testlar kiradi.
        </p>
        <Link href={`/kurs/${slug}`} className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>
          Bekor qilish
        </Link>
      </main>
    </>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
      <span className="hint">{label}</span>
      <span style={{ fontWeight: 600, fontSize: 14, color: muted ? "var(--sub)" : "var(--ink)" }}>{value}</span>
    </div>
  );
}
