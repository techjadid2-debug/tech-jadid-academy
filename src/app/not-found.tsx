import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteNav links={[]} cta={{ href: "/", label: "Bosh sahifa" }} />
      <main className="shell-narrow" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
        <h1 className="page-title">Sahifa topilmadi</h1>
        <p className="page-sub">Siz izlagan sahifa mavjud emas yoki ko&apos;chirilgan.</p>
        <Link href="/" className="btn btn-primary">Bosh sahifaga qaytish</Link>
      </main>
      <SiteFooter />
    </>
  );
}
