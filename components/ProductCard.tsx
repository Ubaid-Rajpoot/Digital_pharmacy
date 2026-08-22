"use client";

import { useStore } from "@/components/StoreProvider";
import { IconEye, IconHeart, IconPlus } from "@/components/icons";
import { CATNAME, isInStock, productImage, pctOff, rupees, starStr, type Product } from "@/lib/products";

export default function ProductCard({ p }: { p: Product }) {
  const { addToCart, categories, openQuick, wishlist, toggleWish } = useStore();
  const off = pctOff(p);
  const wished = wishlist.includes(p.id);
  const inStock = isInStock(p);
  const categoryName = categories.find((c) => c.cat === p.cat)?.name ?? CATNAME[p.cat] ?? p.cat;

  return (
    <article
      className="p-card"
      tabIndex={0}
      onClick={() => openQuick(p.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openQuick(p.id);
        }
      }}
    >
      <div className={`p-media ${p.tint}`}>
        {!inStock ? (
          <span className="p-badge oos">Out of stock</span>
        ) : p.rx ? (
          <span className="p-badge rx">Rx</span>
        ) : off > 0 ? (
          <span className="p-badge">{off}% OFF</span>
        ) : null}
        <button
          className={`p-heart${wished ? " on" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWish(p.id);
          }}
          aria-label="Add to wishlist"
        >
          <IconHeart size={18} strokeWidth={2} />
        </button>
        <img src={productImage(p, 440, 440)} alt={p.name} loading="lazy" />
        <button className="p-quick" onClick={() => openQuick(p.id)}>
          <IconEye size={15} strokeWidth={2} />
          Quick View
        </button>
      </div>
      <div className="p-body">
        <span className="p-brand">
          {p.brand} · {categoryName}
        </span>
        <h4 className="p-name">{p.name}</h4>
        <div className="p-rate">
          <span className="stars">{starStr(p.rating)}</span>
          {p.rating}
          <span>({p.rev.toLocaleString("en-PK")})</span>
        </div>
        <div className="p-buy">
          <div className="p-price">
            <b>{rupees(p.price)}</b>
            <s>{rupees(p.mrp)}</s>
            <span className="save">Save {rupees(p.mrp - p.price)}</span>
          </div>
          <button
            className="p-add"
            disabled={!inStock}
            onClick={(e) => {
              e.stopPropagation();
              addToCart(p.id, 1, e.currentTarget);
            }}
          >
            {inStock ? (
              <>
                <IconPlus size={15} strokeWidth={2.6} />
                Add
              </>
            ) : (
              "Out of stock"
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
