"use client";

// Search bar + category pills shown above the product grid in the medicines
// section. Both write to the same shared filter state as the hero search and
// the categories section, so everything stays in sync.

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { IconArrow, IconSearch } from "@/components/icons";
import { CATNAME, CATSUBS, isInStock, pic, rupees } from "@/lib/products";

const TABS = [
  { f: "all", label: "All" },
  { f: "rx", label: "Prescription" },
  { f: "vitamins", label: "Vitamins" },
  { f: "diabetes", label: "Diabetes" },
  { f: "heart", label: "Heart" },
  { f: "skin", label: "Skin" },
  { f: "baby", label: "Baby" },
  { f: "devices", label: "Devices" },
  { f: "personal", label: "Personal Care" },
];

export default function ProductToolbar() {
  const { products, search, setSearch, cat, setCat, sub, setSub, openQuick } = useStore();
  const [suggestOpen, setSuggestOpen] = useState(false);

  const subs = useMemo(
    () => (cat === "all" ? [] : (CATSUBS[cat] ?? []).filter((s) => products.some((p) => p.cat === cat && p.sub === s))),
    [cat, products]
  );

  const suggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length < 2) return [];

    return products
      .filter((p) =>
        `${p.name} ${p.brand} ${CATNAME[p.cat] || p.cat}`
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 6);
  }, [products, search]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!(event.target as HTMLElement).closest(".prod-search-wrap")) {
        setSuggestOpen(false);
      }
    };

    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  return (
    <div className="prod-toolbar">
      <div className="prod-search-wrap">
        <form
          className="search-pill prod-search"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            setSuggestOpen(false);
          }}
        >
          <IconSearch className="ic" size={18} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search medicines, supplements, healthcare products..."
            aria-label="Search medicines"
            value={search}
            onFocus={() => setSuggestOpen(search.trim().length >= 2)}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              setSuggestOpen(value.trim().length >= 2);
            }}
          />
          <button type="submit" className="search-go" aria-label="Search">
            <span>Search</span>
            <IconArrow size={15} strokeWidth={2.4} />
          </button>
        </form>

        {suggestOpen && (
          <div className="suggest open prod-suggest" role="listbox">
            {suggestions.length === 0 ? (
              <button
                type="button"
                style={{ justifyContent: "center", color: "var(--ink3)" }}
              >
                No medicine found — try another name
              </button>
            ) : (
              suggestions.map((p) => {
                const inStock = isInStock(p);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSearch(p.name);
                      setCat("all");
                      setSuggestOpen(false);
                      openQuick(p.id);
                    }}
                  >
                    <img
                      className="th"
                      src={pic(p.seed, 84, 84)}
                      alt=""
                      loading="lazy"
                    />
                    <span className="si">
                      <span className="nm">{p.name}</span>
                      <span className="ct">
                        {p.brand} · {CATNAME[p.cat] || p.cat}
                      </span>
                    </span>
                    <span className="si-meta">
                      <span className={`st ${inStock ? "st-in" : "st-out"}`}>
                        {inStock ? "In stock" : "Out of stock"}
                      </span>
                      <span className="pr">{rupees(p.price)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      <div className="tabs" aria-label="Filter by category">
        {TABS.map((t) => (
          <button
            key={t.f}
            className={`tab${cat === t.f ? " active" : ""}`}
            onClick={() => setCat(t.f)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subs.length > 0 && (
        <div className="sub-tabs" aria-label="Filter by subcategory">
          <button
            className={`sub-tab${sub === "" ? " active" : ""}`}
            onClick={() => setSub("")}
          >
            All {CATNAME[cat]}
          </button>
          {subs.map((s) => (
            <button
              key={s}
              className={`sub-tab${sub === s ? " active" : ""}`}
              onClick={() => setSub(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
