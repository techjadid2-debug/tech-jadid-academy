import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { formatUzs } from "@/lib/course-data";
import { getCourseAsync } from "@/lib/course";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { getPaymentForCheckout } from "@/lib/payments/db";
import { telegramStartUrl } from "@/lib/telegram";

const PLAN_LABELS: Record<string, string> = {
  monthly: "Oyma-oy to'lash (1-oy)",
  installment2: "2 bo'lib to'lash",
  lifetime: "Bir martalik to'lov",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order = "" } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkout?order=${order}`)}`);
  const payment = order ? await getPaymentForCheckout(user.id, order) : null;
  if (!payment?.courseSlug) redirect("/dashboard?payment=missing");
  const course = await getCourseAsync(payment.courseSlug);
  if (!course) redirect("/dashboard");

  const receiptUrl = telegramStartUrl(payment.id) ?? (env.paymentTelegramUrl || null);
  const canPay = Boolean(env.paymentCardNumber && env.paymentCardHolder && receiptUrl);

  return (
    <>
      <SiteNav cta={{ href: "/dashboard", label: "Kabinet" }} />
      <main className="shell-narrow">
        <div className="page-eyebrow">Shaxsiy to&apos;lov buyurtmasi</div>
        <h1 className="page-title">Buyurtmani tasdiqlang</h1>
        <p className="page-sub">Buyurtma sizning hisobingizga bog&apos;langan. Chek tasdiqlangach kurs va jonli guruh avtomatik ochiladi.</p>

        <div className="panel">
          <Row label="Buyurtma" value={payment.id.slice(0, 8).toUpperCase()} />
          <div className="divider" />
          <Row label="Kurs" value={course.title} />
          <div className="divider" />
          <Row label="Tarif" value={PLAN_LABELS[payment.kind] ?? payment.kind} />
          <div className="divider" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600 }}>Jami</span>
            <span style={{ fontWeight: 700, fontSize: 22 }}>{formatUzs(payment.amountUzs)}</span>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 16, background: "color-mix(in srgb, var(--blue) 8%, var(--card-bg))" }}>
          {canPay ? (
            <>
              <p className="hint">Quyidagi kartaga o&apos;tkazing. So&apos;ng maxsus Telegram havolasi orqali chekni yuboring.</p>
              <div style={{ fontWeight: 700, marginTop: 12 }}>{env.paymentCardNumber}</div>
              <div className="hint">{env.paymentCardHolder}</div>
              <a href={receiptUrl!} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
                Chekni Telegram&apos;da yuborish
              </a>
            </>
          ) : <p className="hint">To&apos;lov rekvizitlari hali sozlanmagan. Ustoz bilan bog&apos;laning.</p>}
        </div>
        <p className="hint" style={{ margin: "14px 4px 0", textAlign: "center" }}>Chek faqat ushbu buyurtma raqami bilan qabul qilinadi. Tasdiq holati kabinetingizda ko&apos;rinadi.</p>
        <Link href="/dashboard" className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>Kabinetga qaytish</Link>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}><span className="hint">{label}</span><span style={{ fontWeight: 600, fontSize: 14 }}>{value}</span></div>;
}
