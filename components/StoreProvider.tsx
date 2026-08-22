"use client";

// Central store for all shared UI state across the Medora landing page:
// cart, wishlist, toasts, modals (quick view / Rx / chat / drawer) and the
// product filter shared between Hero search, Categories and the Products grid.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/products";

/** Storefront category as served by /api/store/catalog. */
export type StoreCategory = {
  cat: string;
  name: string;
  count: number;
  subs: string[];
  image?: string;
  icon?: string;
};

type Totals = { sub: number; save: number; n: number };

type Toast = { id: number; msg: string };

type StoreValue = {
  products: Product[];
  catsubs: Record<string, string[]>;
  categories: StoreCategory[];
  catalogReady: boolean;
  /** Non-null when the live catalogue failed to load (e.g. database down). */
  catalogError: string | null;
  retryCatalog: () => void;

  // product filter (shared between Hero, Categories and Products)
  cat: string;
  setCat: (c: string) => void;
  sub: string; // subcategory filter — only meaningful when a category is active
  setSub: (s: string) => void;
  search: string;
  setSearch: (s: string) => void;

  // cart
  cart: Record<number, number>;
  addToCart: (id: number, qty?: number, fromEl?: HTMLElement | null) => void;
  changeQty: (id: number, delta: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  totals: Totals;

  // wishlist
  wishlist: number[];
  toggleWish: (id: number) => void;

  // cart drawer
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;

  // quick-view modal
  qvId: number | null;
  openQuick: (id: number) => void;
  closeQuick: () => void;

  // prescription modal
  rxOpen: boolean;
  setRxOpen: (v: boolean) => void;
  /** Uploaded prescription attached to the cart until an order is placed. */
  rx: { url: string; name: string } | null;
  setRx: (v: { url: string; name: string } | null) => void;

  // chat
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;

  // toasts
  toasts: Toast[];
  toast: (msg: string) => void;

  scrollToSection: (id: string) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

const REDUCED =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function flyToCart(fromEl: HTMLElement) {
  const cartBtn = document.getElementById("cartBtn");
  if (!cartBtn) return;
  const f = fromEl.getBoundingClientRect();
  const t = cartBtn.getBoundingClientRect();
  const d = document.createElement("span");
  d.className = "fly-dot";
  d.style.left = f.left + f.width / 2 + "px";
  d.style.top = f.top + "px";
  document.body.appendChild(d);
  d.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      {
        transform: `translate(${t.left + t.width / 2 - (f.left + f.width / 2)}px, ${t.top - f.top}px) scale(.25)`,
        opacity: 0.4,
      },
    ],
    { duration: 700, easing: "cubic-bezier(.3,.7,.4,1)" }
  ).onfinish = () => d.remove();
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // The storefront has no product fallback: admin data is the source of
  // truth, including the valid empty-catalogue state.
  const [products, setProducts] = useState<Product[]>([]);
  const [catsubs, setCatsubs] = useState<Record<string, string[]>>({});
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogTick, setCatalogTick] = useState(0);
  const [cat, setCatState] = useState("all");
  const [sub, setSub] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [wishlist, setWishlist] = useState<number[]>([]);
  // Cart/wishlist live in localStorage so they survive reloads; `hydrated`
  // guards against the first client render clobbering stored values.
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rx, setRx] = useState<{ url: string; name: string } | null>(null);
  const [qvId, setQvId] = useState<number | null>(null);
  const [rxOpen, setRxOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const totals = useMemo<Totals>(() => {
    let sub = 0,
      save = 0,
      n = 0;
    for (const [id, q] of Object.entries(cart)) {
      const p = products.find((x) => x.id === Number(id));
      if (!p) continue;
      sub += p.price * q;
      save += (p.mrp - p.price) * q;
      n += q;
    }
    return { sub, save, n };
  }, [cart, products]);

  const toast = useCallback((msg: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const addToCart = useCallback(
    (id: number, qty = 1, fromEl: HTMLElement | null | undefined = null) => {
      setCart((c) => ({ ...c, [id]: (c[id] || 0) + qty }));
      if (fromEl && !REDUCED) flyToCart(fromEl);
      const p = products.find((x) => x.id === id);
      if (p) toast(`${p.name.split("·")[0].trim()} added to your care bag`);
    },
    [products, toast]
  );

  const changeQty = useCallback((id: number, delta: number) => {
    setCart((c) => {
      const q = (c[id] || 0) + delta;
      const next = { ...c };
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }, []);

  const removeItem = useCallback((id: number) => {
    setCart((c) => {
      const next = { ...c };
      delete next[id];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setCart({}), []);

  const toggleWish = useCallback(
    (id: number) => {
      setWishlist((w) => {
        const has = w.includes(id);
        if (!has) toast("Saved to your wishlist 💚");
        return has ? w.filter((x) => x !== id) : [...w, id];
      });
    },
    [toast]
  );

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const openQuick = useCallback((id: number) => setQvId(id), []);
  const closeQuick = useCallback(() => setQvId(null), []);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
      return;
    }
    // Section lives on the home page — navigate there and land on the anchor.
    window.location.href = `/#${id}`;
  }, []);

  // Switching category clears any active subcategory filter.
  const setCat = useCallback((c: string) => {
    setCatState(c);
    setSub("");
  }, []);

  // Restore cart/wishlist from localStorage, then keep them in sync.
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("medora-cart");
      const savedWishlist = localStorage.getItem("medora-wishlist");
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch {
      /* corrupted storage — start fresh */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("medora-cart", JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem("medora-wishlist", JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  // Escape closes any open overlay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setQvId(null);
        setRxOpen(false);
        setChatOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // lock page scroll while any overlay is open
  useEffect(() => {
    const anyOpen = drawerOpen || qvId !== null || rxOpen || chatOpen;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen, qvId, rxOpen, chatOpen]);

  // Load the live catalogue from the backend (MongoDB via /api/store/catalog).
  const retryCatalog = useCallback(() => setCatalogTick((t) => t + 1), []);
  useEffect(() => {
    let alive = true;
    setCatalogError(null);
    fetch("/api/store/catalog", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: { products?: Product[]; catsubs?: Record<string, string[]>; categories?: StoreCategory[] }) => {
        if (!alive) return;
        // A successful empty response is meaningful: the admin may have no
        // active products yet, so do not silently put the demo catalogue back.
        setProducts(Array.isArray(data.products) ? data.products : []);
        setCatsubs(data.catsubs && typeof data.catsubs === "object" ? data.catsubs : {});
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setCatalogReady(true);
      })
      .catch(() => {
        // Do not show stale/demo products when the live catalogue is down —
        // surface the failure so the UI can offer a retry.
        if (alive) {
          setCatalogReady(true);
          setCatalogError("We couldn't load the medicine catalogue. Please check your connection and try again.");
        }
      });
    return () => {
      alive = false;
    };
  }, [catalogTick]);

  const value: StoreValue = {
    products,
    catsubs,
    categories,
    catalogReady,
    catalogError,
    retryCatalog,
    cat,
    setCat,
    sub,
    setSub,
    search,
    setSearch,
    cart,
    addToCart,
    changeQty,
    removeItem,
    clearCart,
    totals,
    wishlist,
    toggleWish,
    drawerOpen,
    openDrawer,
    closeDrawer,
    qvId,
    openQuick,
    closeQuick,
    rxOpen,
    setRxOpen,
    rx,
    setRx,
    chatOpen,
    setChatOpen,
    toasts,
    toast,
    scrollToSection,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
