"use client";

import { useEffect } from "react";
import Reveal, { useReveal } from "@/components/Reveal";
import {
  IconApple,
  IconBell,
  IconBolt,
  IconCheck,
  IconClock,
  IconPlay,
  IconSparkle,
  IconTruck,
} from "@/components/icons";
import { pic } from "@/lib/products";

const APP_FEATURES = [
  {
    title: "Reorder in one tap",
    text: "Your family's refills, remembered automatically",
    icon: <IconBolt size={15} strokeWidth={2.2} />,
  },
  {
    title: "Live delivery tracking",
    text: "Watch your order move, minute by minute",
    icon: <IconClock size={15} strokeWidth={2.2} />,
  },
  {
    title: "Refill & dose reminders",
    text: "Gentle nudges, before you run out",
    icon: <IconBell size={15} strokeWidth={2.2} />,
  },
  {
    title: "App-only care offers",
    text: "Up to 22% off on monthly subscriptions",
    icon: <IconSparkle size={15} strokeWidth={2.2} />,
  },
];

export default function AppSection() {
  const sceneRef = useReveal<HTMLDivElement>();
  const listRefs = [useReveal<HTMLLIElement>(), useReveal<HTMLLIElement>(), useReveal<HTMLLIElement>(), useReveal<HTMLLIElement>()];

  // interactive phone tilt
  useEffect(() => {
    const ps = sceneRef.current;
    if (!ps) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduced || !fine) return;
    const onMove = (e: MouseEvent) => {
      const r = ps.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      const phone = ps.querySelector<HTMLElement>(".phone");
      if (phone) phone.style.transform = `rotateY(${-9 + x * 14}deg) rotateX(${4 - y * 10}deg)`;
    };
    const onLeave = () => {
      const phone = ps.querySelector<HTMLElement>(".phone");
      if (phone) phone.style.transform = "";
    };
    ps.addEventListener("mousemove", onMove);
    ps.addEventListener("mouseleave", onLeave);
    return () => {
      ps.removeEventListener("mousemove", onMove);
      ps.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section className="sec app-band" id="app">
      <div className="wrap app-grid">
        <div>
          <Reveal>
            <span className="eyebrow">The Medora App</span>
          </Reveal>
          <Reveal delay=".08s">
            <h2
              className="h-display"
              style={{ fontSize: "clamp(2rem,3.6vw,3rem)", marginTop: 16 }}
            >
              Healthcare in <em className="leaf">your pocket.</em>
            </h2>
          </Reveal>
          <ul className="app-list">
            {APP_FEATURES.map((f, i) => (
              <li
                key={f.title}
                ref={listRefs[i]}
                className="reveal"
                style={{ "--d": `${0.12 + i * 0.06}s` } as React.CSSProperties}
              >
                <i>{f.icon}</i>
                <div>
                  <b>{f.title}</b>
                  <small>{f.text}</small>
                </div>
              </li>
            ))}
          </ul>
          <Reveal delay=".36s" className="store-row">
            <a className="store-btn" href="#app">
              <IconApple size={22} />
              <span>
                <small>Download on the</small>
                <b>App Store</b>
              </span>
            </a>
            <a className="store-btn" href="#app">
              <IconPlay size={21} />
              <span>
                <small>Get it on</small>
                <b>Google Play</b>
              </span>
            </a>
            <div className="qr-block">
              <svg viewBox="0 0 64 64" aria-label="QR code placeholder">
                <rect width="64" height="64" fill="#fff" />
                <g fill="#0B2447">
                  <rect x="4" y="4" width="18" height="18" />
                  <rect x="42" y="4" width="18" height="18" />
                  <rect x="4" y="42" width="18" height="18" />
                  <rect x="8" y="8" width="10" height="10" fill="#fff" />
                  <rect x="46" y="8" width="10" height="10" fill="#fff" />
                  <rect x="8" y="46" width="10" height="10" fill="#fff" />
                  <rect x="11" y="11" width="4" height="4" />
                  <rect x="49" y="11" width="4" height="4" />
                  <rect x="11" y="49" width="4" height="4" />
                  <rect x="28" y="6" width="4" height="4" />
                  <rect x="28" y="14" width="4" height="4" />
                  <rect x="34" y="10" width="4" height="4" />
                  <rect x="28" y="28" width="8" height="8" />
                  <rect x="42" y="28" width="4" height="4" />
                  <rect x="50" y="28" width="4" height="4" />
                  <rect x="56" y="34" width="4" height="4" />
                  <rect x="28" y="42" width="4" height="4" />
                  <rect x="36" y="46" width="8" height="4" />
                  <rect x="48" y="44" width="8" height="8" />
                  <rect x="28" y="54" width="4" height="6" />
                  <rect x="42" y="56" width="4" height="4" />
                  <rect x="56" y="56" width="4" height="4" />
                </g>
              </svg>
              <small>
                Scan to download
                <br />
                the Medora app
              </small>
            </div>
          </Reveal>
        </div>
        <div
          className="phone-scene reveal"
          style={{ "--d": ".2s" } as React.CSSProperties}
          ref={sceneRef}
        >
          <div className="app-chip ac-1">
            <i className="t-mint">
              <IconCheck size={17} strokeWidth={2.2} />
            </i>
            <div>
              <b>Refill reminder set</b>
              <small>Metformin · every 28 days</small>
            </div>
          </div>
          <div className="phone">
            <img src={pic("medora-app-interface", 420, 880)} alt="Medora app home screen" loading="lazy" />
          </div>
          <div className="app-chip ac-2">
            <i className="t-blue">
              <IconTruck size={17} strokeWidth={2} />
            </i>
            <div>
              <b>Order arriving</b>
              <small>ETA · 12 minutes</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
