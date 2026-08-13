"use client";

import { useEffect, useRef } from "react";
import Reveal from "@/components/Reveal";
import { useStore } from "@/components/StoreProvider";
import { IconArrow } from "@/components/icons";
import { pic } from "@/lib/products";

type Cat = {
  cat: string;
  name: string;
  count: string;
  thumb: string;
  tint: string;
  icon: React.ReactNode;
};

const CATS: Cat[] = [
  {
    cat: "rx",
    name: "Prescription Medicines",
    count: "12,400+ medicines",
    thumb: "prescription-meds",
    tint: "t-blue",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-35 12 12)" />
        <path d="m8.6 8.4 6.8 7.2" />
      </svg>
    ),
  },
  {
    cat: "vitamins",
    name: "Vitamins & Supplements",
    count: "3,200+ products",
    thumb: "vitamins-bottle",
    tint: "t-mint",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
        <circle cx="12" cy="12" r="4.4" />
        <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2.1 2.1M16.9 16.9 19 19M19 5l-2.1 2.1M7.1 16.9 5 19" />
      </svg>
    ),
  },
  {
    cat: "personal",
    name: "Personal Care",
    count: "5,800+ products",
    thumb: "personal-care-items",
    tint: "t-peach",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11Z" />
      </svg>
    ),
  },
  {
    cat: "baby",
    name: "Baby Care",
    count: "2,100+ products",
    thumb: "baby-care-soft",
    tint: "t-lav",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20s-7-4.6-9-9c-1.2-2.7.6-6 3.5-6C8.4 5 10 6.4 12 8.4 14 6.4 15.6 5 17.5 5c2.9 0 4.7 3.3 3.5 6-2 4.4-9 9-9 9Z" />
      </svg>
    ),
  },
  {
    cat: "diabetes",
    name: "Diabetes Care",
    count: "940+ products",
    thumb: "diabetes-monitor",
    tint: "t-blue",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3s6 6.5 6 11a6 6 0 1 1-12 0c0-4.5 6-11 6-11Z" />
        <path d="M9.5 14.5h5M12 12v5" />
      </svg>
    ),
  },
  {
    cat: "heart",
    name: "Heart Care",
    count: "780+ products",
    thumb: "heart-health-bp",
    tint: "t-peach",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20s-7-4.6-9-9c-1.2-2.7.6-6 3.5-6C8.4 5 10 6.4 12 8.4 14 6.4 15.6 5 17.5 5c2.9 0 4.7 3.3 3.5 6-2 4.4-9 9-9 9Z" />
        <path d="M6 12h3l1.5-2.5L13 14l1.5-2H18" />
      </svg>
    ),
  },
  {
    cat: "skin",
    name: "Skin Care",
    count: "3,400+ products",
    thumb: "skincare-serum",
    tint: "t-mint",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v0l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        <path d="M18.5 15.5 19 17l1.5.5L19 18l-.5 1.5L18 18l-1.5-.5L18 17l.5-1.5Z" />
      </svg>
    ),
  },
  {
    cat: "devices",
    name: "Medical Equipment",
    count: "620+ devices",
    thumb: "medical-devices-kit",
    tint: "t-lav",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 4h4v5H5zM15 4h4v5h-4z" />
        <path d="M7 9v3a5 5 0 0 0 10 0V9" />
        <circle cx="12" cy="17" r="2" />
      </svg>
    ),
  },
];

function CatCard({ c, delay }: { c: Cat; delay?: string }) {
  const { setCat, setSearch, scrollToSection } = useStore();
  const ref = useRef<HTMLButtonElement>(null);

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

  return (
    <button
      ref={ref}
      className="cat-card reveal"
      style={delay ? ({ "--d": delay } as React.CSSProperties) : undefined}
      onClick={() => {
        setCat(c.cat);
        setSearch("");
        scrollToSection("medicines");
      }}
    >
      <span className={`cat-ic ${c.tint}`}>{c.icon}</span>
      <img className="cat-thumb" src={pic(c.thumb, 120, 120)} alt="" loading="lazy" />
      <b>{c.name}</b>
      <small>{c.count}</small>
      <span className="cat-arrow">
        <IconArrow size={15} strokeWidth={2.4} />
      </span>
    </button>
  );
}

export default function CategoriesSection() {
  return (
    <section className="sec cats" id="categories">
      <div className="wrap">
        <div className="sec-head">
          <Reveal>
            <span className="eyebrow">Browse with confidence</span>
            <h2 className="h-display">
              Everything your family needs,{" "}
              <em className="accent">thoughtfully organised.</em>
            </h2>
          </Reveal>
          <Reveal delay=".15s">
            <p className="side">
              Eight curated departments, each overseen by a specialist
              pharmacist. Tap a category to see its range.
            </p>
          </Reveal>
        </div>
        <div className="cat-grid">
          {CATS.map((c, i) => (
            <CatCard key={c.cat} c={c} delay={i % 4 === 0 ? undefined : `${(i % 4) * 0.06}s`} />
          ))}
        </div>
      </div>
    </section>
  );
}
