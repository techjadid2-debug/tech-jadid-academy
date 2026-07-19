import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth";
import { registerStudent } from "./actions";

const ERROR_TEXT: Record<string, string> = {
  invalid: "Barcha maydonlarni to'ldiring. Parol kamida 8 belgidan iborat bo'lishi kerak.",
  duplicate: "Bu login band. Boshqa login tanlang yoki kiring.",
  server: "Ro'yxatdan o'tish hozircha ishlamayapti. Birozdan so'ng qayta urinib ko'ring.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <>
      <SiteNav links={[]} cta={{ href: "/login", label: "Kirish" }} />
      <main className="shell-narrow">
        <div className="page-eyebrow" style={{ textAlign: "center" }}>Ro&apos;yxatdan o&apos;tish</div>
        <h1 className="page-title" style={{ textAlign: "center" }}>Kursga ariza qoldiring</h1>
        <p className="page-sub" style={{ textAlign: "center" }}>
          Ro&apos;yxatdan o&apos;tgach arizangiz ustozga yuboriladi. Guruh va tarif kelishilgach shaxsiy checkout tayyorlanadi; to&apos;lovdan keyin dars jadvali ochiladi.
          Birinchi dars — hoziroq bepul.
        </p>

        <div className="panel">
          {error && ERROR_TEXT[error] && (
            <p className="hint" style={{ color: "var(--danger, #d33)", marginBottom: 12 }}>
              {ERROR_TEXT[error]}
            </p>
          )}
          <form action={registerStudent}>
            <div className="field">
              <label htmlFor="fullName">Ismingiz</label>
              <input id="fullName" name="fullName" placeholder="Masalan: Abdulaziz Karimov" required />
            </div>
            <div className="field">
              <label htmlFor="contact">Telegram yoki telefon</label>
              <input id="contact" name="contact" placeholder="@username yoki +998 90 123 45 67" required />
            </div>
            <div className="field">
              <label htmlFor="login">Login</label>
              <input id="login" name="login" pattern="[a-z0-9][a-z0-9_.-]{2,31}" placeholder="masalan: abdulaziz01" autoComplete="username" required />
            </div>
            <div className="field">
              <label htmlFor="password">Parol</label>
              <input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Ariza yuborish
            </button>
          </form>
          <p className="hint" style={{ marginTop: 14, textAlign: "center" }}>
            Hisobingiz bormi? <Link href="/login">Kirish</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
