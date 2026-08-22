export default function Loading() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
      }}
      aria-live="polite"
      aria-busy="true"
    >
      <span style={{ fontSize: 40 }}>🩺</span>
      <p style={{ fontFamily: "var(--ff-m)", fontSize: 13, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--blue)", fontWeight: 600 }}>
        Preparing your care…
      </p>
    </div>
  );
}
