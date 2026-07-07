import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { demoLogin, sendOtp, verifyOtp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; stage?: string; email?: string; error?: string }>;
}) {
  const { next, stage, email, error } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(next && next.startsWith("/") ? next : "/dashboard");

  const safeNext = next ?? "/dashboard";

  return (
    <>
      <SiteNav links={[]} cta={{ href: "/", label: "Bosh sahifa" }} />
      <main className="shell-narrow">
        <div className="page-eyebrow" style={{ textAlign: "center" }}>Kirish</div>
        <h1 className="page-title" style={{ textAlign: "center" }}>Tech Jadid&apos;ga xush kelibsiz</h1>
        <p className="page-sub" style={{ textAlign: "center" }}>
          Darslaringizga kirish uchun hisobingizga kiring.
        </p>

        <div className="panel">
          {isSupabaseConfigured ? (
            <RealAuth stage={stage} email={email} error={error} next={safeNext} />
          ) : (
            <DemoAuth next={safeNext} />
          )}
        </div>
      </main>
    </>
  );
}

// ---- REAL rejim: email OTP -------------------------------------------------

function RealAuth({
  stage,
  email,
  error,
  next,
}: {
  stage?: string;
  email?: string;
  error?: string;
  next: string;
}) {
  const codeStage = stage === "code" && email;

  return (
    <>
      {/* Kelajakdagi usullar */}
      <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginBottom: 10 }} disabled>
        ✈️ Telegram orqali kirish (tez orada)
      </button>
      <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} disabled>
        🔵 Google orqali kirish (tez orada)
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
        <div className="divider" style={{ flex: 1, margin: 0 }} />
        <span className="hint">yoki email orqali</span>
        <div className="divider" style={{ flex: 1, margin: 0 }} />
      </div>

      {error === "send" && (
        <p className="hint" style={{ color: "var(--danger, #d33)", marginBottom: 12 }}>
          Kod yuborishда xatolik. Emailни tekshirib qayta urinib ko&apos;ring.
        </p>
      )}
      {error === "code" && (
        <p className="hint" style={{ color: "var(--danger, #d33)", marginBottom: 12 }}>
          Kod noto&apos;g&apos;ri yoki muddati tugagan. Qayta kiriting.
        </p>
      )}

      {codeStage ? (
        <form action={verifyOtp}>
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="email" value={email} />
          <div className="field">
            <label htmlFor="token">
              <strong>{email}</strong> ga yuborilgan 6 xonali kod
            </label>
            <input
              id="token"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Tasdiqlash
          </button>
          <form action={sendOtp} style={{ marginTop: 10 }}>
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="email" value={email} />
            <button type="submit" className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }}>
              Kodni qayta yuborish
            </button>
          </form>
        </form>
      ) : (
        <form action={sendOtp}>
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <label htmlFor="email">Email manzilingiz</label>
            <input id="email" name="email" type="email" placeholder="you@mail.com" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            Kod yuborish
          </button>
        </form>
      )}

      <p className="hint" style={{ marginTop: 14, textAlign: "center" }}>
        Emailingizga 6 xonali kod yuboramiz. Admin uchun <code>admin@techjadid.uz</code> bilan kiring.
      </p>
    </>
  );
}

// ---- DEMO rejim: ism + kontakt --------------------------------------------

function DemoAuth({ next }: { next: string }) {
  return (
    <>
      <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginBottom: 10 }} disabled>
        ✈️ Telegram orqali kirish (tez orada)
      </button>
      <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }} disabled>
        🔵 Google orqali kirish (tez orada)
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
        <div className="divider" style={{ flex: 1, margin: 0 }} />
        <span className="hint">yoki demo kirish</span>
        <div className="divider" style={{ flex: 1, margin: 0 }} />
      </div>

      <form action={demoLogin}>
        <input type="hidden" name="next" value={next} />
        <div className="field">
          <label htmlFor="name">Ismingiz</label>
          <input id="name" name="name" placeholder="Masalan: Abdulaziz" required />
        </div>
        <div className="field">
          <label htmlFor="contact">Telefon yoki email</label>
          <input id="contact" name="contact" placeholder="+998 90 123 45 67 yoki you@mail.com" required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          Kirish
        </button>
      </form>

      <p className="hint" style={{ marginTop: 14, textAlign: "center" }}>
        Demo rejim: ma&apos;lumot faqat brauzeringizda saqlanadi. Admin uchun{" "}
        <code>admin@techjadid.uz</code> kiriting.
      </p>
    </>
  );
}
