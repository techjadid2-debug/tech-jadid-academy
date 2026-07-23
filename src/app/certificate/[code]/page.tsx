import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { getCertificateByCode } from "@/lib/certificates";

// Ochiq tekshiruv sahifasi — auth talab qilinmaydi (ish beruvchi/tashqi odam
// havola orqali sertifikat haqiqiyligini tekshira oladi).
export default async function CertificatePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const cert = await getCertificateByCode(code);
  if (!cert) notFound();

  const issued = new Date(cert.issuedAt).toLocaleDateString("uz-UZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <SiteNav links={[]} cta={{ href: "/", label: "Kurslar" }} />
      <main className="shell-narrow">
        <div
          className="panel"
          style={{
            textAlign: "center",
            padding: "48px 32px",
            border: "2px solid color-mix(in srgb, var(--blue) 40%, var(--line))",
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 10 }}>🎓</div>
          <div className="page-eyebrow">Sertifikat · Tech Jadid Akademiyasi</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.025em", margin: "6px 0 4px" }}>
            {cert.holderName}
          </h1>
          <p className="page-sub" style={{ marginBottom: 18 }}>
            quyidagi kursni muvaffaqiyatli yakunladi:
          </p>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>{cert.courseTitle}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
            <span className="badge badge-green">✓ Tasdiqlangan</span>
            <span className="badge badge-gray">{issued}</span>
            <span className="badge badge-blue">{cert.code}</span>
          </div>
        </div>
        <p className="hint" style={{ textAlign: "center", marginTop: 16 }}>
          Bu sahifa ochiq havola — sertifikat haqiqiyligini istalgan kishi tekshira oladi.
        </p>
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <Link href="/" className="btn btn-ghost">Akademiya bosh sahifasi</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
