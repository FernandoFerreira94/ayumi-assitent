"use client";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: "#F8F7FC", color: "#17142B", fontFamily: "system-ui, sans-serif" }}>
        <main
          role="alert"
          style={{
            minHeight: "100dvh",
            display: "grid",
            placeContent: "center",
            gap: 12,
            padding: 24,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 22, margin: 0 }}>Algo deu errado</h1>
          <p style={{ margin: 0, color: "#5A5670" }}>O app encontrou um problema. Seus dados estão salvos.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              minHeight: 48,
              borderRadius: 16,
              border: 0,
              background: "#6D4AFF",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Recarregar
          </button>
        </main>
      </body>
    </html>
  );
}
