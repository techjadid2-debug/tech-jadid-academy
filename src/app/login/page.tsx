import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { demoLogin, signInWithPassword } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; registered?: string }>;
}) {
  const { next, error, registered } = await searchParams;
  const user = await getCurrentUser();
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (user) redirect(safeNext);

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
            <RealAuth error={error} registered={registered === "1"} next={safeNext} />
          ) : (
            <DemoAuth next={safeNext} />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

// ---- REAL rejim: admin yaratgan login + parol -----------------------------

function RealAuth({
  error,
  registered,
  next,
}: {
  error?: string;
  registered: boolean;
  next: string;
}) {
  return (
    <>
      {error === "credentials" && (
        <p className="hint" role="alert" aria-live="polite" style={{ color: "var(--red)", marginBottom: 12 }}>
          Login yoki parol noto&apos;g&apos;ri.
        </p>
      )}
      {registered && <p className="hint" role="status" style={{ color: "var(--green)", marginBottom: 12 }}>Hisob va ariza yaratildi. Endi tanlagan login va parolingiz bilan kiring.</p>}
      <form action={signInWithPassword}>
        <input type="hidden" name="next" value={next} />
        <div className="field">
          <label htmlFor="login">Login</label>
          <input id="login" name="login" autoComplete="username" required />
        </div>
        <div className="field">
          <label htmlFor="password">Parol</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <SubmitButton pendingLabel="Kirilmoqda…" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          Kirish
        </SubmitButton>
      </form>

      <p className="hint" style={{ marginTop: 14, textAlign: "center" }}>
        Ro&apos;yxatdan o&apos;tishda o&apos;zingiz tanlagan login va paroldan foydalaning.
        <br />Hisobingiz yo&apos;qmi? <Link href="/register">Ro&apos;yxatdan o&apos;ting</Link>.
        <br />Parol esdan chiqdimi? <a href="https://t.me/tech_jadid" target="_blank" rel="noreferrer">Yordam uchun yozing</a>.
      </p>
    </>
  );
}

// ---- DEMO rejim: ism + kontakt --------------------------------------------

function DemoAuth({ next }: { next: string }) {
  return (
    <>
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
        <SubmitButton pendingLabel="Kirilmoqda…" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          Kirish
        </SubmitButton>
      </form>

      <p className="hint" style={{ marginTop: 14, textAlign: "center" }}>
        Demo rejim: ma&apos;lumot faqat brauzeringizda saqlanadi.
      </p>
    </>
  );
}
