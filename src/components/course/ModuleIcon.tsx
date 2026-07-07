import type { JSX } from "react";

// Har modulga mos SVG ikonka (asl landing'dan).
const ICONS: Record<number, JSX.Element> = {
  1: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <path d="M9 6V3M15 6V3M9 21v-3M15 21v-3M6 9H3M6 15H3M21 9h-3M21 15h-3" />
    </>
  ),
  2: (
    <>
      <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 4V6a1 1 0 0 1 1-1z" />
      <path d="M8 10h8M8 13h5" />
    </>
  ),
  3: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M4 17l4.5-4.5L14 18M14 14l2.5-2.5L20 15" />
    </>
  ),
  4: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12" />,
  5: (
    <>
      <rect x="5" y="8" width="14" height="11" rx="2" />
      <path d="M12 8V4M12 4h-1.5M12 4h1.5" />
      <circle cx="9" cy="13" r="1" />
      <circle cx="15" cy="13" r="1" />
      <path d="M2 12v3M22 12v3" />
    </>
  ),
  6: (
    <>
      <path d="M12 3c3 1.5 5 5 5 9 0 2-1 4-2 5H9c-1-1-2-3-2-5 0-4 2-7.5 5-9z" />
      <circle cx="12" cy="10" r="1.6" />
      <path d="M9 17l-2 4M15 17l2 4" />
    </>
  ),
};

export function ModuleIcon({ order }: { order: number }) {
  return (
    <div className="m-icon">
      <svg viewBox="0 0 24 24">{ICONS[order] ?? ICONS[1]}</svg>
    </div>
  );
}
