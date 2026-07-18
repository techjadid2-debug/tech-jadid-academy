"use client";

import { useState } from "react";
import Link from "next/link";
import type { Course, PricingKind } from "@/lib/types";

function fmt(n: number) {
  return new Intl.NumberFormat("uz-UZ").format(n);
}

export function PurchasePanel({ course, defaultPlan }: { course: Course; defaultPlan: PricingKind }) {
  const [plan, setPlan] = useState<PricingKind>(defaultPlan);

  const option = course.pricing.find((p) => p.kind === plan) ?? course.pricing[0];

  return (
    <div className="panel" style={{ position: "sticky", top: 72 }}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Jonli guruhga yozilish</div>
      <p className="hint" style={{ marginBottom: 18 }}>
        To&apos;lov karta o&apos;tkazmasi orqali. Chekni Telegram&apos;ga yuboring; tasdiqdan so&apos;ng siz jonli guruhga qo&apos;shilasiz va platforma kirishi ochiladi.
      </p>

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

      <Link
        href={`/checkout?slug=${encodeURIComponent(course.slug)}&kind=${encodeURIComponent(plan)}`}
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
      >
        {fmt(option.priceUzs)} so&apos;m — Davom etish
      </Link>

      <p className="hint" style={{ marginTop: 12, textAlign: "center" }}>
        2 oy davomida kechki Google Meet darslari: slayd, nazariya, amaliyot va testlar bilan.
      </p>
    </div>
  );
}
