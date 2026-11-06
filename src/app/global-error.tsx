"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="uz">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ maxWidth: 520, textAlign: "center" }}>
            <h1>Texnik xatolik yuz berdi</h1>
            <p>Sahifani qayta yuklab ko&apos;ring. Muammo davom etsa, yordamga yozing.</p>
            <button type="button" onClick={reset}>
              Qayta urinish
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
