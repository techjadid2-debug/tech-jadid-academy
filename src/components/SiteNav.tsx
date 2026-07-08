"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface NavLink {
  href: string;
  label: string;
}

interface SiteNavProps {
  /** Bo'lim havolalari (landing uchun ankerlar) */
  links?: NavLink[];
  /** O'ng tarafdagi asosiy tugma */
  cta?: { href: string; label: string };
}

const DEFAULT_LINKS: NavLink[] = [
  { href: "/#m1", label: "Poydevor" },
  { href: "/#m2", label: "Prompt" },
  { href: "/#m3", label: "Media" },
  { href: "/#m4", label: "Vibe Coding" },
  { href: "/#m5", label: "Agentlar" },
  { href: "/#portfolio", label: "Portfolio" },
];

export function SiteNav({ links = DEFAULT_LINKS, cta = { href: "/#narx", label: "Kursga yozilish" } }: SiteNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* localStorage yo'q bo'lsa — jim o'tamiz */
    }
  };

  return (
    <header className={`nav${scrolled ? " scrolled" : ""}`} id="nav">
      <div className="nav-inner">
        <Link href="/" className="brand">
          <span className="g">
            <i /><i /><i /><i />
          </span>
          Tech&nbsp;Jadid
        </Link>

        <nav className={`nav-links${menuOpen ? " open" : ""}`} id="menu">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href={cta.href} className="nav-cta-mobile" onClick={() => setMenuOpen(false)}>
            {cta.label}
          </Link>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Rejimni almashtirish" type="button">
            <svg className="sun" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19" />
            </svg>
            <svg className="moon" viewBox="0 0 24 24">
              <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
            </svg>
          </button>
          <Link href={cta.href} className="nav-cta">
            {cta.label}
          </Link>
        </div>

        <button
          className="burger"
          aria-label="Menyu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          type="button"
        >
          <span /><span /><span />
        </button>
      </div>
    </header>
  );
}
