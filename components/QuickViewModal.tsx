"use client";

import { useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { IconShield, IconX } from "@/components/icons";
import { CATNAME, isInStock, pic, pctOff, rupees } from "@/lib/products";

export default function QuickViewModal() {
  const { qvId, closeQuick, addToCart, openDrawer, products } = useStore();
  const [qty, setQty] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");

  const p = qvId !== null ? products.find((x) => x.id === qvId) : undefined;

  // reset quantity whenever the opened product changes (adjust state during
  // render rather than in an effect — the React-recommended pattern)
  const [prevQvId, setPrevQvId] = useState<number | null>(qvId);
  if (prevQvId !== qvId) {
    setPrevQvId(qvId);
    setQty(1);
    setSelectedImageIndex(0);
  }

  if (!p) return null;

  const inStock = isInStock(p);
  const imageSeeds = p.gallery?.length ? p.gallery : [p.seed];
  const activeImageIndex = Math.min(selectedImageIndex, imageSeeds.length - 1);

  const handleImageMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomOrigin(`${x}% ${y}%`);
  };

  const handleAdd = (el: HTMLElement | null) => {
    addToCart(p.id, qty, el);
    closeQuick();
    setTimeout(openDrawer, 350);
  };

  return (
    <div
      className="modal-wrap show"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "qvModal") closeQuick();
      }}
      id="qvModal"
    >
      <div className="modal">
        <button className="icon-x modal-x" onClick={closeQuick} aria-label="Close">
          <IconX size={17} strokeWidth={2.2} />
        </button>
        <div className="qv-grid">
          <div className={`qv-media ${p.tint}`}>
            <div
              className={`qv-image-frame${zoomed ? " zoomed" : ""}`}
              onMouseEnter={() => setZoomed(true)}
              onMouseMove={handleImageMove}
              onMouseLeave={() => setZoomed(false)}
              title="Move your cursor over the image to zoom"
            >
              <img
                className="qv-main-img"
                src={pic(imageSeeds[activeImageIndex], 600, 600)}
                alt={`${p.name} image ${activeImageIndex + 1}`}
                style={{ transformOrigin: zoomOrigin }}
              />
              <span className="qv-zoom-hint" aria-hidden="true">
                Move to zoom
              </span>
            </div>
            {imageSeeds.length > 1 && (
              <div className="qv-thumbs" role="list" aria-label="Product images">
                {imageSeeds.map((seed, index) => (
                  <button
                    key={seed}
                    type="button"
                    role="listitem"
                    className={`qv-thumb${index === activeImageIndex ? " active" : ""}`}
                    aria-label={`Show product image ${index + 1}`}
                    aria-current={index === activeImageIndex ? "true" : undefined}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setZoomed(false);
                      setZoomOrigin("50% 50%");
                    }}
                  >
                    <img
                      src={pic(seed, 120, 120)}
                      alt={`${p.name} thumbnail ${index + 1}`}
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="qv-body">
            <span className="p-brand">
              {p.brand.toUpperCase()} · {CATNAME[p.cat] || p.cat}
            </span>
            <h3>{p.name}</h3>
            <div className="qv-rate">
              <span className="stars">★★★★★</span>
              <b>{p.rating}</b>
              <span>· {p.rev.toLocaleString("en-PK")} verified reviews</span>
            </div>
            <p className="qv-desc">{p.desc}</p>
            <div className="qv-salt">℞ {p.salt}</div>
            <div className="qv-price">
              <b>{rupees(p.price * qty)}</b>
              <s>{rupees(p.mrp * qty)}</s>
              <span className="sv">{pctOff(p)}% OFF</span>
            </div>
            <div className="qv-actions">
              <div className="qv-qty">
                <button
                  aria-label="Decrease"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span>{qty}</span>
                <button
                  aria-label="Increase"
                  onClick={() => setQty((q) => Math.min(9, q + 1))}
                >
                  +
                </button>
              </div>
              <button
                className="btn btn-primary"
                style={{ flex: 1, opacity: inStock ? 1 : 0.6 }}
                disabled={!inStock}
                onClick={(e) => handleAdd(e.currentTarget)}
              >
                {inStock ? "Add to Care Bag" : "Out of stock"}
              </button>
            </div>
            {p.rx && (
              <div className="qv-rx show">
                <IconShield size={17} strokeWidth={2} />
                Prescription required — our pharmacist will verify before
                dispatch.
              </div>
            )}
            {!inStock && (
              <div className="qv-oos">
                ⚠️ This item is currently out of stock — restocking soon.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
