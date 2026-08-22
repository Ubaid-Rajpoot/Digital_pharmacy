"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import { useStore } from "@/components/StoreProvider";
import { IconCheckCircle } from "@/components/icons";
import { pic } from "@/lib/products";

const ARTICLES = [
  {
    tag: "Nutrition",
    tint: "t-mint",
    title: "Understanding Vitamin D: the sunshine deficit most of us live with",
    author: "Dr. A. Osei",
    time: "6 min read",
    seed: "vitamin-d-sunlight",
  },
  {
    tag: "Diabetes",
    tint: "t-blue",
    title: "A gentle guide to managing diabetes at home — without the overwhelm",
    author: "Care Team",
    time: "9 min read",
    seed: "diabetes-home-care",
  },
  {
    tag: "Heart Health",
    tint: "t-peach",
    title: "Five-minute habits for a healthier heart, backed by our cardiologists",
    author: "Dr. R. Bhatt",
    time: "5 min read",
    seed: "heart-healthy-habits",
  },
];

export default function WellnessSection() {
  const { toast } = useStore();
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // capture the form synchronously — e.currentTarget is null after await
    const form = e.currentTarget;
    const input = form.elements.namedItem("email") as HTMLInputElement | null;
    const email = input?.value?.trim() ?? "";
    if (!email) return;
    setBusy(true);
    try {
      const res = await fetch("/api/store/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Couldn't subscribe — please try again");
        return;
      }
      form.style.display = "none";
      setSubscribed(true);
      toast(data.already ? "You're already on the list — thank you! 💚" : "Subscribed! Your first wellness letter is on its way 💌");
    } catch {
      toast("Network hiccup — please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="sec" id="wellness">
      <div className="wrap">
        <Reveal className="news-band">
          <div>
            <h3>Small steps today, healthier tomorrow.</h3>
            <p>
              Weekly health tips, medicine guides &amp; wellness wisdom —
              written by our pharmacists, never spam.
            </p>
          </div>
          {!subscribed ? (
            <form className="news-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                name="email"
                required
                placeholder="Your email address"
                aria-label="Email address"
              />
              <button
                className="btn btn-primary"
                type="submit"
                style={{ padding: "12px 22px" }}
                disabled={busy}
              >
                {busy ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
          ) : (
            <div className="news-done show">
              <IconCheckCircle size={30} strokeWidth={2.4} />
              Welcome to the family! Check your inbox 💚
            </div>
          )}
        </Reveal>
        {/* ===== From our care journal section (commented out) ===== */}
        {/* <div className="sec-head" style={{ marginBottom: 40 }}>
          <Reveal>
            <span className="eyebrow">From our care journal</span>
            <h2 className="h-display" style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", marginTop: 14 }}>
              Read, learn, feel better.
            </h2>
          </Reveal>
        </div>
        <div className="articles">
          {ARTICLES.map((a, i) => (
            <Reveal key={a.seed} delay={i === 0 ? undefined : `${i * 0.1}s`} className="article">
              <div className="im">
                <img src={pic(a.seed, 640, 400)} alt={a.title} loading="lazy" />
              </div>
              <div className="ab">
                <span className={`a-tag ${a.tint}`}>{a.tag}</span>
                <h4>{a.title}</h4>
                <div className="a-meta">
                  <span>{a.author}</span>
                  <span>·</span>
                  <span>{a.time}</span>
                  <span className="rd">Guide →</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div> */}
      </div>
    </section>
  );
}
