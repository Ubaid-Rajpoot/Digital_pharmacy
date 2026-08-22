import Link from "next/link";

export default function NotFound() {
  return (
    <section className="sec" style={{ paddingTop: 120, paddingBottom: 120 }}>
      <div className="wrap" style={{ textAlign: "center", maxWidth: 640 }}>
        <p style={{ fontSize: 64, marginBottom: 6 }}>🩺</p>
        <span className="eyebrow">Page not found</span>
        <h1 className="h-display" style={{ fontSize: "clamp(32px,5vw,52px)", margin: "14px 0 12px" }}>
          This shelf is empty.
        </h1>
        <p className="sec-sub" style={{ margin: "0 auto 28px" }}>
          The page you were looking for isn&apos;t here — it may have moved, or the link
          might be slightly off. Let&apos;s get you back to something helpful.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-primary">
            Back to the store
          </Link>
          <Link href="/#medicines" className="btn btn-ghost">
            Browse medicines
          </Link>
        </div>
      </div>
    </section>
  );
}
