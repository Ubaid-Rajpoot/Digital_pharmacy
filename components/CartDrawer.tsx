"use client";

import { useRouter } from "next/navigation";
import { useStore } from "@/components/StoreProvider";
import { IconArrow, IconX } from "@/components/icons";
import { FREE_AT, productImage, rupees, type Product } from "@/lib/products";

function CartItem({
  p,
  q,
  changeQty,
  removeItem,
}: {
  p: Product;
  q: number;
  changeQty: (id: number, delta: number) => void;
  removeItem: (id: number) => void;
}) {
  return (
    <div className="ci">
      <img className="th" src={productImage(p, 140, 140)} alt="" />
      <div className="inf">
        <b>{p.name}</b>
        <small>{p.brand}</small>
        <div className="pr">{rupees(p.price * q)}</div>
        <div className="qty">
          <button
            aria-label="Decrease"
            onClick={() => changeQty(p.id, -1)}
          >
            −
          </button>
          <span>{q}</span>
          <button aria-label="Increase" onClick={() => changeQty(p.id, 1)}>
            +
          </button>
        </div>
      </div>
      <button
        className="ci-rm"
        onClick={() => removeItem(p.id)}
        aria-label="Remove"
      >
        <IconX size={16} strokeWidth={2} />
      </button>
    </div>
  );
}

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    products,
    totals,
    changeQty,
    removeItem,
    drawerOpen,
    closeDrawer,
    toast,
    scrollToSection,
  } = useStore();

  const items = Object.entries(cart)
    .map(([id, q]) => ({ id: Number(id), q }))
    .filter(({ id }) => cart[id] > 0);

  const free = totals.sub >= FREE_AT || totals.sub === 0;

  return (
    <>
      <div
        className={`overlay${drawerOpen ? " show" : ""}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <aside className={`drawer${drawerOpen ? " open" : ""}`} aria-label="Shopping cart">
        <div className="drawer-head">
          <div>
            <h3>Your Care Bag</h3>
            <small>
              {totals.n} item{totals.n === 1 ? "" : "s"} · packed with care
            </small>
          </div>
          <button className="icon-x" onClick={closeDrawer} aria-label="Close cart">
            <IconX size={17} strokeWidth={2.2} />
          </button>
        </div>
        <div className="cart-items">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="em">🧺</div>
              <b>Your care bag is empty</b>
              <p>Let&apos;s fill it with something kind.</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: 18 }}
                onClick={() => {
                  closeDrawer();
                  scrollToSection("medicines");
                }}
              >
                Browse Medicines
              </button>
            </div>
          ) : (
            items.map(({ id, q }) => {
              const p = products.find((x) => x.id === id);
              if (!p) return null;
              return (
                <CartItem
                  key={id}
                  p={p}
                  q={q}
                  changeQty={changeQty}
                  removeItem={removeItem}
                />
              );
            })
          )}
        </div>
        <div className="drawer-foot">
          <div className="cf-row">
            <span>You save</span>
            <span className="gr">−{rupees(totals.save)}</span>
          </div>
          <div className="cf-row">
            <span>Delivery</span>
            <span className="gr">{free ? "FREE" : rupees(40)}</span>
          </div>
          <div className="cf-row total">
            <span>Total</span>
            <b>{rupees(totals.sub)}</b>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!items.length) {
                toast("Your care bag is empty — add something kind first");
                return;
              }
              closeDrawer();
              router.push("/checkout");
            }}
          >
            Proceed to Secure Checkout <IconArrow size={16} strokeWidth={2.4} />
          </button>
          <p className="drawer-note">
            🔒 256-bit encrypted · Genuine medicines guaranteed
          </p>
        </div>
      </aside>
    </>
  );
}
