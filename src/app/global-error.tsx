"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ background: "#0b0f17", color: "#e8ecf6", fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <main style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", gap: 16, padding: 16, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, margin: 0 }}>Immolia est momentanément indisponible</h1>
          <p style={{ opacity: 0.75, margin: 0 }}>Vos données ne sont pas perdues. Merci de réessayer dans un instant.</p>
          <button onClick={() => reset()} style={{ height: 40, borderRadius: 8, border: 0, background: "#c8f560", color: "#0b0f17", fontWeight: 600, cursor: "pointer" }}>
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
