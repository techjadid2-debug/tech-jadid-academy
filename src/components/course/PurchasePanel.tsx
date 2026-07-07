"use client";

import { useState } from "react";
import type { Course, PaymentProvider, PricingKind } from "@/lib/types";
import { startCheckout } from "@/app/kurs/[slug]/actions";

const PROVIDERS: { id: PaymentProvider; label: string; hint: string }[] = [
  { id: "payme", label: "Payme", hint: "Karta orqali" },
  { id: "click", label: "Click", hint: "Karta orqali" },
  { id: "uzum", label: "Uzum", hint: "Uzum Bank" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("uz-UZ").format(n);
}

export function PurchasePanel({ course, defaultPlan }: { course: Course; defaultPlan: PricingKind }) {
  const [plan, setPlan] = useState<PricingKind>(defaultPlan);
  const [provider, setProvider] = useState<PaymentProvider>("payme");

  const option = course.pricing.find((p) => p.kind === plan) ?? course.pricing[0];

  return (
    <div className="panel" style={{ position: "sticky", top: 72 }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Kursga yozilish</div>
      <p className="hint" style={{ marginBottom: 18 }}>To&apos;lov turini va usulini tanlang.</p>

      {/* Plan tanlash */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
        {course.pricing.map((p) => (
          <label
            key={p.kind}
            className="price-card"
            style={{
              padding: "14px 16px",
              cursor: "pointer",
              borderColor: plan === p.kind ? "var(--blue)" : "var(--line)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.label}</div>
                <div className="hint">{p.note}</div>
              </div>
              <input
                type="radio"
                name="plan-choice"
                checked={plan === p.kind}
                onChange={() => setPlan(p.kind)}
                style={{ width: 18, height: 18, flexShrink: 0 }}
              />
            </div>
            <div style={{ fontWeight: 700, fontSize: 20, marginTop: 8 }}>
              {fmt(p.priceUzs)} so&apos;m{p.kind === "monthly" && <span className="hint"> / oy</span>}
            </div>
          </label>
        ))}
      </div>

      {/* Provayder tanlash */}
      <div className="field">
        <label>To&apos;lov usuli</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {PROVIDERS.map((pr) => (
            <button
              key={pr.id}
              type="button"
              onClick={() => setProvider(pr.id)}
              className="badge"
              style={{
                justifyContent: "center",
                padding: "10px 6px",
                flexDirection: "column",
                gap: 2,
                border: "1px solid " + (provider === pr.id ? "var(--blue)" : "var(--line)"),
                background: provider === pr.id ? "color-mix(in srgb, var(--blue) 12%, transparent)" : "var(--mist)",
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              <span style={{ fontWeight: 700 }}>{pr.label}</span>
              <span className="hint" style={{ fontSize: 10 }}>{pr.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <form action={startCheckout}>
        <input type="hidden" name="slug" value={course.slug} />
        <input type="hidden" name="kind" value={plan} />
        <input type="hidden" name="provider" value={provider} />
        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
          {fmt(option.priceUzs)} so&apos;m — To&apos;lash
        </button>
      </form>

      <p className="hint" style={{ marginTop: 12, textAlign: "center" }}>
        🔒 To&apos;lov xavfsiz. Doimiy kirish — umrbod, oylik — istalgan vaqt bekor qilinadi.
      </p>
    </div>
  );
}
