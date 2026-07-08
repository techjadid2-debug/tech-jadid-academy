import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { formatUzs } from "@/lib/course-data";
import { getCourseAsync } from "@/lib/course";
import { getCurrentUser } from "@/lib/auth";
import { PROVIDER_LABELS } from "@/lib/payments";
import type { PaymentProvider } from "@/lib/types";
import { completeMockPayment } from "./actions";

const PLAN_LABELS: Record<string, string> = {
  monthly: "Oylik obuna",
  installment2: "2 bo'lib to'lash",
  lifetime: "Bir martalik to'lov",
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; slug?: string; kind?: string; amount?: string; order?: string; step?: string }>;
}) {
  const sp = await searchParams;
  const slug = sp.slug ?? "";
  const course = await getCourseAsync(slug);
  if (!course) redirect("/");

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/kurs/${slug}`)}`);

  const provider = (sp.provider ?? "payme") as PaymentProvider;
  const amount = Number(sp.amount ?? 0);
  const kind = sp.kind && sp.kind in PLAN_LABELS ? sp.kind : "lifetime";
  const step = sp.step === "2" ? "2" : "1";
  const planLabel = kind === "installment2" ? `${PLAN_LABELS[kind]} (${step === "2" ? "2-qism" : "1-qism"})` : PLAN_LABELS[kind];

  return (
    <>
      <SiteNav cta={{ href: "/dashboard", label: "Kabinet" }} />
      <main className="shell-narrow">
        <div className="page-eyebrow">To&apos;lov</div>
        <h1 className="page-title">Buyurtmani tasdiqlang</h1>
        <p className="page-sub">Quyidagi ma&apos;lumotlarni tekshiring va to&apos;lovni yakunlang.</p>

        <div className="panel">
          <Row label="Kurs" value={course.title} />
          <div className="divider" />
          <Row label="Tarif" value={planLabel} />
          <div className="divider" />
          <Row label="To'lov usuli" value={PROVIDER_LABELS[provider]} />
          <div className="divider" />
          <Row label="Buyurtma" value={sp.order ?? "—"} muted />
          <div className="divider" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600 }}>Jami</span>
            <span style={{ fontWeight: 700, fontSize: 22 }}>{formatUzs(amount)}</span>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 16, background: "color-mix(in srgb, var(--yellow) 8%, var(--card-bg))" }}>
          <p className="hint">
            ⚠️ <b>Demo rejim.</b> Haqiqiy {PROVIDER_LABELS[provider]} kalitlari hali ulanmagan. Bu tugma
            to&apos;lovni simulyatsiya qilib, kursni ochadi. Real rejimda bu yerda {PROVIDER_LABELS[provider]}{" "}
            to&apos;lov oynasi chiqadi va tasdiqlashni webhook bajaradi.
          </p>
        </div>

        <form action={completeMockPayment} style={{ marginTop: 20 }}>
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="provider" value={provider} />
          <input type="hidden" name="step" value={step} />
          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            {formatUzs(amount)} — To&apos;lovni tasdiqlash (demo)
          </button>
        </form>
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
