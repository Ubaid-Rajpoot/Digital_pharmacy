"use client";

// Fades content in when it scrolls into view (same behaviour as the
// `.reveal` / IntersectionObserver logic in medical_store2.html).

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * Attach a ref from this hook to any element that already carries the
 * `.reveal` class — the `in` class is added when it scrolls into view.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

type RevealProps = {
  children: ReactNode;
  /** transition delay, e.g. ".08s" (sets the --d CSS variable) */
  delay?: string;
  className?: string;
};

export default function Reveal({ children, delay, className }: RevealProps) {
  const ref = useReveal<HTMLDivElement>();

  const style: CSSProperties | undefined = delay
    ? ({ "--d": delay } as CSSProperties)
    : undefined;

  return (
    <div ref={ref} className={`reveal ${className ?? ""}`.trim()} style={style}>
      {children}
    </div>
  );
}
