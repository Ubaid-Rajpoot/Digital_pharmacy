"use client";

export default function GlobalRouteError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="sec" style={{ paddingTop: 120, paddingBottom: 120 }}>
      <div className="wrap" style={{ textAlign: "center", maxWidth: 640 }}>
        <p style={{ fontSize: 64, marginBottom: 6 }}>💊</p>
        <span className="eyebrow">Something went wrong</span>
        <h1 className="h-display" style={{ fontSize: "clamp(30px,4vw,46px)", margin: "14px 0 12px" }}>
          A momentary glitch — not an emergency.
        </h1>
        <p className="sec-sub" style={{ margin: "0 auto 10px" }}>
          An unexpected error interrupted this page. Trying again usually fixes it.
        </p>
        <p style={{ fontFamily: "var(--ff-m)", fontSize: 12, color: "var(--ink2)", opacity: 0.7, marginBottom: 26 }}>
          {error.message || "Unknown error"}
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary" onClick={reset}>
            Try again
          </button>
          <a href="/" className="btn btn-ghost">
            Back to the store
          </a>
        </div>
      </div>
    </section>
  );
}
