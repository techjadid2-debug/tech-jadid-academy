"use client";

import { useRef, useState } from "react";

// "Sinab ko'ring" — darsdagi amaliy AI maydoni (W3Schools uslubi).
// /api/sandbox'ga so'rov yuborib, javobni oqim (streaming) sifatida ko'rsatadi.
export function AiSandbox({ slug, order }: { slug: string; order: number }) {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function run() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setOutput("");
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, order, prompt }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Xatolik yuz berdi. Keyinroq urinib ko'ring.");
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Tarmoq xatosi. Qayta urinib ko'ring.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>⚡ Sinab ko&apos;ring</h2>
      <p className="hint" style={{ marginBottom: 14 }}>
        Dars mavzusini shu yerning o&apos;zida amalda sinang — promptingizni yozing, AI javob beradi.
      </p>
      <div className="panel" style={{ maxWidth: 640 }}>
        <div className="field" style={{ marginBottom: 10 }}>
          <label>Promptingiz</label>
          <textarea
            rows={4}
            maxLength={2000}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Masalan: Menga oilaviy restoran uchun Instagram post matni yozib ber — rol, kontekst va formatni o'zim belgilab ko'raman..."
          />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={run}
            disabled={loading || !prompt.trim()}
            style={{ padding: "9px 18px", fontSize: 14 }}
          >
            {loading ? "Javob yozilmoqda…" : "Ishga tushirish →"}
          </button>
          <span className="hint">{prompt.length}/2000</span>
        </div>

        {error && (
          <p className="hint" style={{ color: "var(--red)", marginTop: 12 }}>⚠️ {error}</p>
        )}
        {output && (
          <div
            style={{
              marginTop: 14,
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid var(--line)",
              background: "var(--mist)",
              fontSize: 14,
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
            }}
          >
            {output}
            {loading && <span style={{ opacity: 0.5 }}>▌</span>}
          </div>
        )}
      </div>
    </div>
  );
}
