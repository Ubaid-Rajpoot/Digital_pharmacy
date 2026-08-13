"use client";

import { useStore } from "@/components/StoreProvider";
import { IconCheck, IconCross, IconMail, IconPhone, IconPin } from "@/components/icons";

export default function Footer() {
  const { setRxOpen } = useStore();
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <a href="#home" className="logo">
              <span className="mk">
                <IconCross size={18} strokeWidth={3.2} />
              </span>
              <span>
                Medora
                <small style={{ color: "rgba(255,255,255,.5)" }}>Care, delivered</small>
              </span>
            </a>
            <p>
              Buying medicine is not buying a product — it&apos;s buying hope,
              care, and a better tomorrow. Medora is a licensed online pharmacy
              serving 2.4 million families across 950+ cities with genuine
              medicines, expert guidance, and a promise kept.
            </p>
            <div className="foot-badges">
              <span>
                <IconCheck size={11} strokeWidth={3} /> Verified Pharmacy
              </span>
              <span>
                <IconCheck size={11} strokeWidth={3} /> ISO 9001:2015
              </span>
              <span>
                <IconCheck size={11} strokeWidth={3} /> 256-bit SSL
              </span>
            </div>
            <div className="socials">
              <a href="#" aria-label="Instagram">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="#" aria-label="X">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.6 3H21l-7.4 8.5L22.2 21h-6.8l-5.3-6.4L4 21H.6l7.9-9.1L1.5 3h7l4.8 5.9L17.6 3Zm-1.2 16h1.9L6.6 4.9H4.6L16.4 19Z" />
                </svg>
              </a>
              <a href="#" aria-label="Facebook">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.5 21v-7h2.6l.5-3h-3.1V9.1c0-.9.3-1.6 1.6-1.6h1.6V4.8c-.8-.1-1.7-.2-2.5-.2-2.5 0-4.2 1.5-4.2 4.3V11H7.5v3h2.5v7h3.5Z" />
                </svg>
              </a>
              <a href="#" aria-label="YouTube">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12c0 1.6.1 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8c1.5.4 7.8.4 7.8.4s6.3 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.3-1.6.4-3.2.4-4.8s-.1-3.2-.4-4.8ZM10 15.2V8.8l5.5 3.2L10 15.2Z" />
                </svg>
              </a>
            </div>
          </div>
          <div className="foot-col">
            <h5>Shop</h5>
            <a href="#medicines">Prescription Medicines</a>
            <a href="#categories">Vitamins &amp; Supplements</a>
            <a href="#categories">Baby &amp; Mother Care</a>
            <a href="#categories">Diabetes &amp; Heart Care</a>
            <a href="#categories">Medical Equipment</a>
            <a href="#medicines">All Products</a>
          </div>
          <div className="foot-col">
            <h5>Support</h5>
            <a href="#" onClick={(e) => { e.preventDefault(); setRxOpen(true); }}>
              Upload Prescription
            </a>
            <a href="#medicines">Track Your Order</a>
            <a href="#">Delivery Policy</a>
            <a href="#">Returns &amp; Refunds</a>
            <a href="#consult">Talk to a Pharmacist</a>
            <a href="#app">Download the App</a>
          </div>
          <div className="foot-col">
            <h5>Contact</h5>
            <ul className="foot-contact">
              <li>
                <i>
                  <IconPhone size={15} strokeWidth={1.9} />
                </i>
                1800-MEDORA
                <br />
                <small style={{ opacity: 0.55 }}>24×7, toll-free</small>
              </li>
              <li>
                <i>
                  <IconMail size={15} strokeWidth={1.9} />
                </i>
                care@medora.health
              </li>
              <li>
                <i>
                  <IconPin size={15} strokeWidth={1.9} />
                </i>
                Medora Health HQ, 12 Wellness Avenue, Mumbai 400001
              </li>
            </ul>
          </div>
        </div>
        <p className="foot-disclaimer">
          Medora operates through government-licensed retail pharmacies (Licence
          No. MH-MUM-118842). Prescription medicines are dispensed only against a
          valid prescription reviewed by a registered pharmacist. Content on this
          site is for informational purposes and is not a substitute for
          professional medical advice.
        </p>
        <div className="foot-bottom">
          <span>
            © {year} Medora Health Pvt. Ltd. ·{" "}
            <a href="#" style={{ textDecoration: "underline" }}>
              Privacy Policy
            </a>{" "}
            ·{" "}
            <a href="#" style={{ textDecoration: "underline" }}>
              Terms &amp; Conditions
            </a>
          </span>
          <div className="pay-chips">
            <span>VISA</span>
            <span>MASTERCARD</span>
            <span>UPI</span>
            <span>AMEX</span>
            <span>COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
