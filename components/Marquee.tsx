import { IconCross } from "@/components/icons";

const ITEMS = [
  "WHO-GMP Certified Partners",
  "Cold-Chain Logistics · 2–8°C",
  "Licensed Pharmacists On Call",
  "256-bit Secure Payments",
  "Discreet, Tamper-Proof Packaging",
  "4.9★ Rated By 214,000+ Families",
];

// Content is rendered twice for the seamless infinite scroll loop
// (the original page duplicated the track via JS).
export default function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span className="mi" key={i}>
            <IconCross size={14} strokeWidth={2.6} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
