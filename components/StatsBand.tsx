"use client";

import { useEffect, useRef, useState } from "react";

type StatDef = {
  count: number;
  dec?: number;
  suffix: string;
  label: string;
  delay?: string;
};

const STATS: StatDef[] = [
  { count: 2.4, dec: 1, suffix: "M+", label: "Families cared for" },
  { count: 18, dec: 0, suffix: "k+", label: "Medicines in stock" },
  { count: 950, dec: 0, suffix: "+", label: "Cities served daily" },
  { count: 45, dec: 0, suffix: "min", label: "Fastest delivery time" },
];

function Stat({ count, dec = 0, suffix, label, delay }: StatDef) {
  const [value, setValue] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // count up from 0 to the target once the stat scrolls into view.
  // All state updates happen inside the observer/rAF callbacks (not the
  // effect body) so the animation is resilient to reduced-motion settings.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          setInView(true);
          if (reduced) {
            setValue(count);
            return;
          }
          const t0 = performance.now();
          const D = 1600;
          const step = (t: number) => {
            const k = Math.min(1, (t - t0) / D);
            const ease = 1 - Math.pow(1 - k, 3);
            setValue(count * ease);
            if (k < 1) raf = requestAnimationFrame(step);
          };
          raf = requestAnimationFrame(step);
        });
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [count]);

  return (
    <div
      ref={ref}
      className={`stat reveal${inView ? " in" : ""}`}
      style={delay ? ({ "--d": delay } as React.CSSProperties) : undefined}
    >
      <b>
        <span>{value.toFixed(dec)}</span>
        <span>{suffix}</span>
      </b>
      <small>{label}</small>
    </div>
  );
}

export default function StatsBand() {
  return (
    <div className="stats">
      <div className="wrap stats-grid">
        {STATS.map((s, i) => (
          <Stat key={s.label} {...s} delay={i === 0 ? undefined : `${i * 0.08}s`} />
        ))}
      </div>
    </div>
  );
}
