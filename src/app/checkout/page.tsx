import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { getCourse, formatUzs } from "@/lib/course-data";
import { getCurrentUser } from "@/lib/auth";
import { PROVIDER_LABELS } from "@/lib/payments";
import type { PaymentProvider } from "@/lib/types";
import { completeMockPayment } from "./actions";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; slug?: string; kind?: string; amount?: string; order?: string }>;
}) {
  const sp = await searchParams;
  const slug = sp.slug ?? "";
  const course = getCourse(slug);
  if (!course) redirect("/");

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/kurs/${slug}`)}`);

  const provider = (sp.provider ?? "payme") as PaymentProvider;
  const amount = Number(sp.amount ?? 0);
  const kind = sp.kind === "monthly" ? "monthly" : "lifetime";

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
          <Row label="Tarif" value={kind === "monthly" ? "Oylik obuna" : "Doimiy kirish"} />
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
