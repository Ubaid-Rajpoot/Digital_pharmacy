"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { IconCart, IconCross, IconMenu, IconRx } from "@/components/icons";

export default function Header() {
  const { totals, openDrawer, setRxOpen, scrollToSection } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const prevCount = useRef(totals.n);

  // Section links must work from every page, not just home: scroll when the
  // target is on this page, otherwise navigate to /#<section>.
  const goTo = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToSection(id);
  };

  // scroll → header background + reading progress bar + show/hide back-to-top
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const h = document.documentElement;
      const p = h.scrollTop / (h.scrollHeight - h.clientHeight);
      if (progressRef.current) progressRef.current.style.width = p * 100 + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // bump animation on the cart badge when the item count changes
  useEffect(() => {
    if (totals.n !== prevCount.current) {
      prevCount.current = totals.n;
      const el = countRef.current;
      if (el) {
        el.classList.remove("bump");
        void el.offsetWidth; // restart animation
        el.classList.add("bump");
      }
    }
  }, [totals.n]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="progress" ref={progressRef} aria-hidden="true" />
      <header className={scrolled ? "scrolled" : undefined}>
        <div className="wrap nav">
          <a href="/#home" className="logo" onClick={goTo("home")}>
            <span className="mk" style={{ color: "#fff" }}>
              <IconCross size={18} strokeWidth={3.2} />
            </span>
            <span>
              Medora<small>Care, delivered</small>
            </span>
          </a>
          <nav className="nav-links" aria-label="Primary">
            <a href="/#medicines" onClick={goTo("medicines")}>Medicines</a>
            <a href="/#categories" onClick={goTo("categories")}>Categories</a>
            <a href="/#consult" onClick={goTo("consult")}>Consult</a>
            <a href="/#wellness" onClick={goTo("wellness")}>Wellness</a>
            <a href="/#reviews" onClick={goTo("reviews")}>Reviews</a>
          </nav>
          <div className="nav-right">
            <button className="rx-link" onClick={() => setRxOpen(true)}>
              <IconRx size={16} strokeWidth={2} />
              <span>Upload Rx</span>
            </button>
            <button
              className="cart-btn"
              id="cartBtn"
              aria-label="Open cart"
              onClick={openDrawer}
            >
              <IconCart size={20} strokeWidth={1.9} />
              <span className="cart-count" ref={countRef}>
                {totals.n}
              </span>
            </button>
            <a href="/#medicines" className="btn btn-primary nav-cta" onClick={goTo("medicines")}>
              Order Now
            </a>
            <button
              id="menuBtn"
              aria-label="Menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <IconMenu size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>
      {menuOpen && (
        <div className="mobile-menu open" onClick={closeMenu}>
          <a href="/#medicines" onClick={goTo("medicines")}>Medicines</a>
          <a href="/#categories" onClick={goTo("categories")}>Categories</a>
          <a href="/#consult" onClick={goTo("consult")}>Consult a Doctor</a>
          <a href="/#wellness" onClick={goTo("wellness")}>Wellness</a>
          <a href="/#reviews" onClick={goTo("reviews")}>Reviews</a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              closeMenu();
              setRxOpen(true);
            }}
          >
            Upload Prescription
          </a>
        </div>
      )}
    </>
  );
}
