"use client";

// Full-screen loader shown on first paint, fades out after the page settles.
// Also adds the `loaded` class to <body> which triggers the hero entrance
// animations (same as the original page).

import { useEffect, useState } from "react";

export default function Loader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = setTimeout(() => {
      setDone(true);
      document.body.classList.add("loaded");
    }, reduced ? 100 : 1100);
    const t2 = setTimeout(() => {
      setDone(true);
      document.body.classList.add("loaded");
    }, 2800); // safety net
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className={`loader${done ? " done" : ""}`} aria-hidden="true">
      <div className="lg-mark">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 4v16M4 12h16" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
        </svg>
      </div>
      <svg className="ecg" viewBox="0 0 230 56">
        <path d="M4 30h38l8-14 10 28 9-36 9 36 7-14h30l6-9 8 18 6-9h81" />
      </svg>
      <p>Medora · Care Loading</p>
    </div>
  );
}
