"use client";

import { useEffect, useRef } from "react";

// Draws the ECG line once it scrolls into view (same as the original page).
export default function EcgWave() {
  const ref = useRef<SVGPathElement>(null);

  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          const L = p.getTotalLength();
          p.style.strokeDasharray = String(L);
          p.style.strokeDashoffset = String(L);
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            p.style.strokeDashoffset = "0";
            return;
          }
          p.style.transition =
            "stroke-dashoffset 1.8s cubic-bezier(.22,1,.36,1)";
          requestAnimationFrame(() => (p.style.strokeDashoffset = "0"));
        });
      },
      { threshold: 0.4 }
    );
    io.observe(p);
    return () => io.disconnect();
  }, []);

  return (
    <svg
      className="why-ecg reveal"
      style={{ "--d": ".3s" } as React.CSSProperties}
      width="280"
      height="52"
      viewBox="0 0 280 52"
      aria-hidden="true"
    >
      <path
        ref={ref}
        d="M4 26h56l8-12 10 24 9-32 9 32 7-12h44l6-8 8 16 6-8h109"
      />
    </svg>
  );
}
