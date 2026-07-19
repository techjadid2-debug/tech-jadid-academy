"use client";

import { useState } from "react";

export function CopyButton({ value, label = "Havolani nusxalash" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className="btn btn-ghost" onClick={copy} aria-live="polite">
      {copied ? "Nusxalandi ✓" : label}
    </button>
  );
}
