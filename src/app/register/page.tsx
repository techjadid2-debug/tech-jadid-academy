import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentUser } from "@/lib/auth";
import { registerStudent } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { COURSES, PRIMARY_COURSE } from "@/lib/course-data";

const ERROR_TEXT: Record<string, string> = {
  invalid: "Barcha maydonlarni to'ldiring. Parol kamida 8 belgidan iborat bo'lishi kerak.",
  duplicate: "Bu login band. Boshqa login tanlang yoki kiring.",
  server: "Ro'yxatdan o'tish hozircha ishlamayapti. Birozdan so'ng qayta urinib ko'ring.",
  contact: "Telegram username yoki O'zbekiston telefon raqamini to'g'ri kiriting.",
  password: "Parol va takroriy parol bir xil emas.",
  consent: "Arizani yuborish uchun aloqa ma'lumotidan foydalanishga rozilik bering.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; course?: string }>;
}) {
  const { error, course } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const selectedCourse = COURSES.find((c) => c.slug === course) ?? PRIMARY_COURSE;

  return (
    <>
      <SiteNav links={[]} cta={{ href: "/login", label: "Kirish" }} />
      <main className="shell-narrow">
        <div className="page-eyebrow" style={{ textAlign: "center" }}>Ro&apos;yxatdan o&apos;tish · {selectedCourse.title}</div>
        <h1 className="page-title" style={{ textAlign: "center" }}>Kursga ariza qoldiring</h1>
        <p className="page-sub" style={{ textAlign: "center" }}>
          Ro&apos;yxatdan o&apos;tgach arizangiz ustozga yuboriladi. Guruh va tarif kelishilgach shaxsiy checkout tayyorlanadi; to&apos;lovdan keyin dars jadvali ochiladi.
          Birinchi dars — hoziroq bepul.
        </p>

        <div className="panel">
          {error && ERROR_TEXT[error] && (
            <p className="hint" role="alert" aria-live="polite" style={{ color: "var(--red)", marginBottom: 12 }}>
              {ERROR_TEXT[error]}
            </p>
          )}
          <form action={registerStudent}>
            <input type="hidden" name="course" value={selectedCourse.slug} />
            <div className="field">
              <label htmlFor="fullName">Ismingiz</label>
              <input id="fullName" name="fullName" placeholder="Masalan: Abdulaziz Karimov" required />
            </div>
            <div className="field">
              <label htmlFor="contact">Telegram yoki telefon</label>
              <input id="contact" name="contact" placeholder="@username yoki +998 90 123 45 67" autoComplete="tel" required />
              <span className="hint">Masalan: @abdulaziz yoki +998 90 123 45 67</span>
            </div>
            <div className="field">
              <label htmlFor="login">Login</label>
              <input id="login" name="login" pattern="[A-Za-z0-9][A-Za-z0-9_.-]{2,31}" placeholder="masalan: abdulaziz01" autoComplete="username" required />
              <span className="hint">3–32 belgi: harf, raqam, nuqta, chiziqcha yoki pastki chiziq.</span>
            </div>
            <div className="field">
              <label htmlFor="password">Parol</label>
              <input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
            </div>
            <div className="field">
              <label htmlFor="passwordConfirm">Parolni takrorlang</label>
              <input id="passwordConfirm" name="passwordConfirm" type="password" minLength={8} autoComplete="new-password" required />
            </div>
            <label className="consent-row">
              <input type="checkbox" name="consent" required />
              <span>Ustoz arizam bo&apos;yicha men bilan Telegram yoki telefon orqali bog&apos;lanishiga roziman.</span>
            </label>
            <SubmitButton pendingLabel="Ariza yuborilmoqda…" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Ariza yuborish
            </SubmitButton>
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
