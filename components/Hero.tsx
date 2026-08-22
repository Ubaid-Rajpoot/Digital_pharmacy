"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";
import {
  IconArrow,
  IconChat,
  IconCheck,
  IconRx,
  IconSearch,
  IconThermo,
  IconTruck,
} from "@/components/icons";
import { CATNAME, isInStock, pic, productImage, rupees } from "@/lib/products";

const POPULAR = ["Paracetamol", "Vitamin D3", "Immunity", "Diabetes care"];

export default function Hero() {
  const { products, categories, setCat, setSearch, openQuick, setChatOpen, setRxOpen, scrollToSection } =
    useStore();
  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.cat, c.name])) as Record<string, string>,
    [categories]
  );
  const [q, setQ] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    return products
      .filter((p) =>
        (p.name + " " + p.brand + " " + (categoryNames[p.cat] || CATNAME[p.cat] || p.cat))
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 6);
  }, [categoryNames, q, products]);

  // close suggestions on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".search-wrap")) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // subtle mouse parallax over the hero visual
  useEffect(() => {
    const hv = heroRef.current;
    if (!hv) return;
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduced || !fine) return;
    const onMove = (e: MouseEvent) => {
      const r = hv.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      hv.querySelectorAll<HTMLElement>("[data-depth]").forEach((el) => {
        const d = parseFloat(el.dataset.depth || "0");
        el.style.transform = `translate3d(${-x * d * 220}px, ${-y * d * 220}px, 0)`;
      });
    };
    const onLeave = () => {
      hv.querySelectorAll<HTMLElement>("[data-depth]").forEach(
        (el) => (el.style.transform = "")
      );
    };
    hv.addEventListener("mousemove", onMove);
    hv.addEventListener("mouseleave", onLeave);
    return () => {
      hv.removeEventListener("mousemove", onMove);
      hv.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const runSearch = (value: string) => {
    const v = value.trim().toLowerCase();
    setSearch(v);
    setCat("all");
    setSuggestOpen(false);
    scrollToSection("medicines");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(q);
  };

  const chipClick = (chip: string) => {
    setQ(chip);
    runSearch(chip);
  };

  return (
    <section className="hero" id="home">
      <div className="wrap hero-grid">
        <div>
          <span className="eyebrow hero-fade fd-4" style={{ marginBottom: 20 }}>
            Licensed Pharmacy · Est. 2016
          </span>
          <h1 className="h-display">
            <span className="line">
              <span>Your Health</span>
            </span>
            <span className="line">
              <span>Deserves The</span>
            </span>
            <span className="line">
              <span>
                <em className="accent">Best Care.</em>
              </span>
            </span>
          </h1>
          <p className="hero-sub">
            Get genuine medicines delivered safely to your doorstep — with
            trusted quality, expert guidance, and care you can rely on. Because
            buying medicine is buying hope, and we never take that lightly.
          </p>

          <div className="search-wrap hero-fade fd-5">
            <form className="search-pill" autoComplete="off" onSubmit={handleSubmit}>
              <IconSearch className="ic" size={20} strokeWidth={2} />
              <input
                type="text"
                placeholder="Search medicines, supplements, healthcare products..."
                aria-label="Search medicines"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSuggestOpen(e.target.value.trim().length >= 2);
                }}
              />
              <button
                type="button"
                className="rx-split"
                onClick={() => setRxOpen(true)}
              >
                <IconRx size={15} strokeWidth={2.2} />
                Upload Rx
              </button>
              <button type="submit" className="search-go">
                <span>Search</span>
                <IconArrow size={16} strokeWidth={2.4} />
              </button>
            </form>
            {suggestOpen && (
              <div className="suggest open" role="listbox">
                {suggestions.length === 0 ? (
                  <button
                    type="button"
                    style={{ justifyContent: "center", color: "var(--ink3)" }}
                  >
                    No matches — try &quot;vitamin&quot; or &quot;baby&quot;
                  </button>
                ) : (
                  suggestions.map((p) => {
                    const inStock = isInStock(p);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          openQuick(p.id);
                          setSuggestOpen(false);
                        }}
                      >
                        <img
                          className="th"
                          src={productImage(p, 84, 84)}
                          alt=""
                          loading="lazy"
                        />
                        <span className="si">
                          <span className="nm">{p.name.split("·")[0].trim()}</span>
                          <span className="ct">
                            {p.brand} · {categoryNames[p.cat] || CATNAME[p.cat] || p.cat}
                          </span>
                        </span>
                        <span className="si-meta">
                          <span className={`st ${inStock ? "st-in" : "st-out"}`}>
                            {inStock ? "In stock" : "Out of stock"}
                          </span>
                          <span className="pr">{rupees(p.price)}</span>
                        </span>
                        <Link
                          href={`/product/${p.id}`}
                          onClick={() => setSuggestOpen(false)}
                          style={{ fontSize: 11, fontWeight: 800, color: "var(--blue)", padding: "6px 11px", borderRadius: 9, border: "1.5px solid var(--line2)", textDecoration: "none", whiteSpace: "nowrap" }}
                        >
                          Details →
                        </Link>
                      </button>
                    );
                  })
                )}
              </div>
            )}
            <div className="pop-searches">
              <span>Popular:</span>
              {POPULAR.map((chip) => (
                <button key={chip} className="pop-chip" onClick={() => chipClick(chip)}>
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="hero-ctas hero-fade fd-6">
            <a href="/#medicines" className="btn btn-primary" onClick={(e) => { e.preventDefault(); scrollToSection("medicines"); }}>
              Order Medicines Now <IconArrow size={17} strokeWidth={2.4} />
            </a>
            <button className="btn btn-ghost" onClick={() => setChatOpen(true)}>
              <IconChat size={17} strokeWidth={2} />
              Consult a Pharmacist
            </button>
          </div>

          <div className="trust-row hero-fade fd-7">
            {[
              "100% Genuine Medicines",
              "Fast & Safe Delivery",
              "Verified Pharmacy",
              "Secure Payments",
            ].map((t) => (
              <div className="trust-item" key={t}>
                <i>
                  <IconCheck size={12} strokeWidth={3} />
                </i>
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual" ref={heroRef}>
          <div className="hv-dots" aria-hidden="true" />
          <div className="hv-main" data-depth="0.015">
            <img
              src={pic("family-healthcare-warmth", 900, 1080)}
              alt="A family feeling safe and cared for at home"
            />
            <div className="hv-cap">
              <span className="dot" />
              <div>
                <b>The Sharma family</b>
                <small>Medora care members since 2021</small>
              </div>
            </div>
          </div>
          <div className="float-card fc-delivery" data-depth="0.05">
            <div className="row">
              <span className="ic">
                <IconTruck size={18} strokeWidth={1.9} />
              </span>
              <div>
                Order #8214
                <br />
                <small>Out for delivery · arrives by 6 PM</small>
              </div>
            </div>
            <div className="fc-bar">
              <i />
            </div>
          </div>
          <div className="float-card fc-temp" data-depth="0.07">
            <span className="ic">
              <IconThermo size={18} strokeWidth={1.9} />
            </span>
            <div>
              <b>Cold-chain 2–8°C</b>
              <small>Temperature stable · monitored</small>
            </div>
          </div>
          <div className="float-card fc-rating" data-depth="0.06">
            <b>4.9</b>
            <div>
              <div className="stars">★★★★★</div>
              <small>214,000+ reviews</small>
            </div>
          </div>
          <div className="float-card fc-genuine" data-depth="0.045">
            <i>
              <IconCheck size={16} strokeWidth={2.4} />
            </i>
            <div>
              <b>100% Genuine</b>
              <small>Every batch verified</small>
            </div>
          </div>
          <span className="capsule cap1" aria-hidden="true" />
          <span className="capsule cap2" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
