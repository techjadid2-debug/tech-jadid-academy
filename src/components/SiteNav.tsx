"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface NavLink {
  href: string;
  label: string;
}

interface SiteNavProps {
  /** Bo'lim havolalari (landing uchun ankerlar) */
  links?: NavLink[];
  /** O'ng tarafdagi asosiy tugma */
  cta?: { href: string; label: string; external?: boolean };
  /** Asosiy tugmadan oldingi ikkilamchi havola */
  secondaryCta?: { href: string; label: string; external?: boolean };
}

const DEFAULT_LINKS: NavLink[] = [
  { href: "/#kurslar", label: "Kurslar" },
  { href: "/kurs/ai-video-creator", label: "AI Video Creator" },
  { href: "/kurs/ai-builder", label: "AI Builder" },
];
const DEFAULT_CTA = { href: "/login", label: "Kirish" };

export function SiteNav({ links = DEFAULT_LINKS, cta = DEFAULT_CTA, secondaryCta }: SiteNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

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

        <nav ref={menuRef} className={`nav-links${menuOpen ? " open" : ""}`} id="menu" aria-label="Asosiy menyu">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
          {secondaryCta && (
            secondaryCta.external ? (
              <a href={secondaryCta.href} className="nav-secondary-mobile" target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>{secondaryCta.label}</a>
            ) : (
              <Link href={secondaryCta.href} className="nav-secondary-mobile" onClick={() => setMenuOpen(false)}>{secondaryCta.label}</Link>
            )
          )}
          {cta.external ? (
            <a href={cta.href} className="nav-cta-mobile" target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>
              {cta.label}
            </a>
          ) : (
            <Link href={cta.href} className="nav-cta-mobile" onClick={() => setMenuOpen(false)}>
              {cta.label}
            </Link>
          )}
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
          {secondaryCta && (
            secondaryCta.external ? (
              <a href={secondaryCta.href} className="nav-secondary" target="_blank" rel="noreferrer">{secondaryCta.label}</a>
            ) : (
              <Link href={secondaryCta.href} className="nav-secondary">{secondaryCta.label}</Link>
            )
          )}
          {cta.external ? (
            <a href={cta.href} className="nav-cta" target="_blank" rel="noreferrer">
              {cta.label}
            </a>
          ) : (
            <Link href={cta.href} className="nav-cta">
              {cta.label}
            </Link>
          )}
        </div>

        <button
          className="burger"
          aria-label="Menyu"
          aria-controls="menu"
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
