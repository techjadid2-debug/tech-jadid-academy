import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { demoLogin, signInWithPassword } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
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
            <RealAuth error={error} next={safeNext} />
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
  next,
}: {
  error?: string;
  next: string;
}) {
  return (
    <>
      {error === "credentials" && (
        <p className="hint" style={{ color: "var(--danger, #d33)", marginBottom: 12 }}>
          Login yoki parol noto&apos;g&apos;ri.
        </p>
      )}
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
        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          Kirish
        </button>
      </form>

      <p className="hint" style={{ marginTop: 14, textAlign: "center" }}>
        Login va parolni kurs tasdiqlangach admin Telegram orqali yuboradi.
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
        <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
          Kirish
        </button>
      </form>

      <p className="hint" style={{ marginTop: 14, textAlign: "center" }}>
        Demo rejim: ma&apos;lumot faqat brauzeringizda saqlanadi.
      </p>
    </>
  );
}
