"use client";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#070c1a",
          color: "#ffffff",
          padding: "2rem",
        }}
      >
        <main style={{ maxWidth: "34rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>Something went wrong</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
            We could not load this page. Please try again, and if the problem continues, contact the trust
            administration.
          </p>
          {error.digest ? (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", marginTop: "1rem" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={retry}
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.75rem",
              borderRadius: "9999px",
              border: "none",
              background: "linear-gradient(90deg,#d9ad46,#c8952f)",
              color: "#0a1020",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
