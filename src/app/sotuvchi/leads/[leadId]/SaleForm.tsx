"use client";

import { useActionState, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { SubmitButton } from "@/components/SubmitButton";
import {
  completeLeadSale,
  type CompleteSaleState,
} from "@/app/sotuvchi/actions";

const INITIAL_STATE: CompleteSaleState = { status: "idle", message: "" };

export function SaleForm({
  leadId,
  plans,
}: {
  leadId: string;
  plans: { kind: "lifetime" | "monthly"; label: string; priceUzs: number }[];
}) {
  const [state, action] = useActionState(completeLeadSale, INITIAL_STATE);
  const [selectedKind, setSelectedKind] = useState(plans[0]?.kind ?? "lifetime");
  const [amount, setAmount] = useState(plans[0]?.priceUzs ?? 0);

  if (state.status === "success") {
    const credentials = state.temporaryPassword
      ? `Login: ${state.login}\nVaqtinchalik parol: ${state.temporaryPassword}`
      : `Login: ${state.login}`;
    return (
      <div className="crm-sale-success" role="status">
        <span aria-hidden="true">✓</span>
        <div>
          <h3>Kurs ochildi</h3>
          <p>{state.message}</p>
          <div className="crm-credentials">
            <code>Login: {state.login}</code>
            {state.temporaryPassword && <code>Parol: {state.temporaryPassword}</code>}
          </div>
          <CopyButton value={credentials} label="Login va parolni nusxalash" />
          <p className="hint">
            Parol bazada saqlanmaydi va sahifani yangilagach qayta ko&apos;rinmaydi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="crm-sale-form">
      <input type="hidden" name="leadId" value={leadId} />
      {state.status === "error" && (
        <p className="lead-form-error" role="alert">{state.message}</p>
      )}
      <div className="field">
        <label htmlFor="sale-kind">Tarif</label>
        <select
          id="sale-kind"
          name="kind"
          value={selectedKind}
          onChange={(event) => {
            const nextKind = event.target.value as "lifetime" | "monthly";
            setSelectedKind(nextKind);
            const plan = plans.find((item) => item.kind === nextKind);
            if (plan) setAmount(plan.priceUzs);
          }}
        >
          {plans.map((plan) => (
            <option key={plan.kind} value={plan.kind}>{plan.label}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="sale-amount">To&apos;langan summa, so&apos;m</label>
        <input
          id="sale-amount"
          name="amountUzs"
          type="number"
          min={1}
          step={1000}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="sale-login">O&apos;quvchi logini</label>
        <input
          id="sale-login"
          name="login"
          pattern="[a-z0-9][a-z0-9_.-]{2,31}"
          placeholder="masalan: abdulaziz01"
          autoComplete="off"
          required
        />
        <span className="hint">Mavjud o&apos;quvchi loginini kiritsangiz yangi hisob yaratilmaydi.</span>
      </div>
      <div className="field">
        <label htmlFor="sale-password">Yangi hisob uchun vaqtinchalik parol</label>
        <input
          id="sale-password"
          name="password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          placeholder="Kamida 8 belgi"
        />
      </div>
      <SubmitButton
        pendingLabel="To'lov saqlanmoqda…"
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center" }}
      >
        To&apos;landi va kursni ochish
      </SubmitButton>
    </form>
  );
}
