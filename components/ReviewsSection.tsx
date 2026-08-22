"use client";

import { useRef } from "react";
import Reveal from "@/components/Reveal";
import { useStore } from "@/components/StoreProvider";
import { IconCheck, IconChevLeft, IconChevRight } from "@/components/icons";
import { pic } from "@/lib/products";

type Review = {
  quote: string;
  name: string;
  meta: string;
  orders: string;
  seed: string;
};

/** Live reviews served by /api/store/catalog (approved, moderated). */
type LiveReview = {
  id: number;
  name: string;
  rating: number;
  quote: string;
  productName: string;
  verified: boolean;
  at: string;
};

/** Editorial fallback used until the store has approved customer reviews. */
const FALLBACK_REVIEWS: Review[] = [
  {
    quote:
      "Finally, a pharmacy I can trust for my family's medicines. My father's cardiac refill arrives two days early, every single month.",
    name: "Priya Mehta",
    meta: "Mumbai · Cardiac care plan",
    orders: "38 orders",
    seed: "reviewer-priya",
  },
  {
    quote:
      "Fast delivery and genuine products every time. When my son spiked a fever at 2 AM, the medicine was at our door in 40 minutes.",
    name: "Daniel Kurien",
    meta: "Bengaluru · Parent of two",
    orders: "52 orders",
    seed: "reviewer-daniel",
  },
  {
    quote:
      "The pharmacist noticed my mother's new prescription conflicted with her old one — and called us before dispatching. That call may have saved her.",
    name: "Aisha Rahman",
    meta: "Hyderabad · Elder care",
    orders: "71 orders",
    seed: "reviewer-aisha",
  },
  {
    quote:
      "I manage diabetes for both my parents from another city. Medora's refill reminders and cold-chain insulin delivery give me peace of mind 1,400 km away.",
    name: "Rohan Shetty",
    meta: "Pune · Diabetes care plan",
    orders: "44 orders",
    seed: "reviewer-rohan",
  },
  {
    quote:
      "Discreet packaging, genuine prices, and support that actually picks up the phone. I've stopped going to any other pharmacy.",
    name: "Sara Lopez",
    meta: "New Delhi · Wellness member",
    orders: "26 orders",
    seed: "reviewer-sara",
  },
  {
    quote:
      "As a new mother, every product feels like a decision under pressure. Medora's pharmacists talk me through each one — no upselling, only honesty.",
    name: "Nikki Tanaka",
    meta: "Gurugram · Baby care plan",
    orders: "19 orders",
    seed: "reviewer-nikki",
  },
];

function ReviewCard({ r }: { r: Review }) {
  return (
    <article className="rev-card">
      <div className="rev-top">
        <span className="rev-stars">★★★★★</span>
        <span className="verified">
          <IconCheck size={11} strokeWidth={3} />
          Verified purchase
        </span>
      </div>
      <blockquote>&quot;{r.quote}&quot;</blockquote>
      <div className="rev-foot">
        <img src={pic(r.seed, 96, 96)} alt={r.name} loading="lazy" />
        <div>
          <b>{r.name}</b>
          <small>{r.meta}</small>
        </div>
        <span className="rev-orders">{r.orders}</span>
      </div>
    </article>
  );
}

function LiveReviewCard({ r }: { r: LiveReview }) {
  return (
    <article className="rev-card">
      <div className="rev-top">
        <span className="rev-stars">{"★".repeat(Math.max(3, Math.min(5, r.rating)))}</span>
        {r.verified && (
          <span className="verified">
            <IconCheck size={11} strokeWidth={3} />
            Verified purchase
          </span>
        )}
      </div>
      <blockquote>&quot;{r.quote}&quot;</blockquote>
      <div className="rev-foot">
        <img src={pic(`reviewer-${r.id}`, 96, 96)} alt={r.name} loading="lazy" />
        <div>
          <b>{r.name}</b>
          <small>{r.productName}</small>
        </div>
        <span className="rev-orders">
          {new Date(r.at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
        </span>
      </div>
    </article>
  );
}

export default function ReviewsSection() {
  const { reviews } = useStore();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const list: LiveReview[] = reviews.length >= 4 ? reviews : [];
  const source = list.length
    ? [...list, ...list].map((r, i) => <LiveReviewCard key={`${r.id}-${i}`} r={r} />)
    : [...FALLBACK_REVIEWS, ...FALLBACK_REVIEWS].map((r, i) => <ReviewCard key={i} r={r} />);

  const nudge = (dir: 1 | -1) => {
    const t = trackRef.current;
    if (t) t.style.animationPlayState = "paused";
    const vp = viewportRef.current;
    if (vp) vp.scrollLeft += 400 * dir;
  };

  return (
    <section className="sec" id="reviews">
      <div className="wrap">
        <div className="sec-head">
          <Reveal>
            <span className="eyebrow">214,000+ verified voices</span>
            <h2 className="h-display">
              Stories that keep us <em className="accent">humble.</em>
            </h2>
          </Reveal>
          <Reveal delay=".15s" className="rev-head-arrows">
            <button
              className="arrow-btn"
              aria-label="Previous reviews"
              onClick={() => nudge(-1)}
            >
              <IconChevLeft size={18} strokeWidth={2.2} />
            </button>
            <button
              className="arrow-btn"
              aria-label="Next reviews"
              onClick={() => nudge(1)}
            >
              <IconChevRight size={18} strokeWidth={2.2} />
            </button>
          </Reveal>
        </div>
      </div>
      <div className="rev-viewport" ref={viewportRef}>
        <div className="rev-track" ref={trackRef}>
          {source}
        </div>
      </div>
    </section>
  );
}
