import Reveal from "@/components/Reveal";
import EcgWave from "@/components/EcgWave";
import {
  IconChatDots,
  IconClock,
  IconHome,
  IconPack,
  IconShield,
  IconThermo,
} from "@/components/icons";

const FEATURES = [
  {
    num: "01",
    title: "Authentic products only",
    text: "Sourced directly from manufacturers with full batch traceability. Scan any pack to see its journey to your door.",
    icon: <IconShield size={23} strokeWidth={1.9} />,
  },
  {
    num: "02",
    title: "Licensed pharmacy partners",
    text: "Every dispensing centre is government-licensed and staffed by registered pharmacists — never middlemen.",
    icon: <IconHome size={23} strokeWidth={1.9} />,
  },
  {
    num: "03",
    title: "Temperature-controlled storage",
    text: "Cold-chain certified warehouses keep insulin, vaccines and biologics at a strict 2–8°C, logged every 60 seconds.",
    icon: <IconThermo size={23} strokeWidth={1.9} />,
  },
  {
    num: "04",
    title: "Secure, discreet packaging",
    text: "Tamper-evident seals, crush-proof boxes, and plain outer labels. Your health is your business alone.",
    icon: <IconPack size={23} strokeWidth={1.9} />,
  },
  {
    num: "05",
    title: "Same-day delivery options",
    text: "Order before noon for same-day delivery across 950+ cities — or choose our 45-minute express in metro zones.",
    icon: <IconClock size={23} strokeWidth={1.9} />,
  },
  {
    num: "06",
    title: "24/7 human support",
    text: "No bots when it matters. A real pharmacist or care agent answers within 60 seconds, any hour of any day.",
    icon: <IconChatDots size={23} strokeWidth={1.9} />,
  },
];

export default function WhySection() {
  return (
    <section className="sec why" id="why">
      <div className="wrap why-grid">
        <div className="why-left">
          <Reveal>
            <span className="eyebrow">The Medora Standard</span>
          </Reveal>
          <Reveal delay=".08s">
            <h2 className="h-display">
              Healthcare you can trust,{" "}
              <em className="accent">every single time.</em>
            </h2>
          </Reveal>
          <Reveal delay=".16s">
            <p>
              Trust isn&apos;t claimed — it&apos;s built, order by order. Here
              are the six promises we hold ourselves to, audited every quarter
              and published openly.
            </p>
          </Reveal>
          <Reveal delay=".24s">
            <div className="cert-row">
              <span className="cert">
                <i />
                WHO-GMP Sourcing
              </span>
              <span className="cert">
                <i />
                ISO 9001:2015
              </span>
              <span className="cert">
                <i />
                Govt. Licensed
              </span>
              <span className="cert">
                <i />
                99.98% Order Accuracy
              </span>
            </div>
          </Reveal>
          <EcgWave />
        </div>
        <div>
          {FEATURES.map((f, i) => (
            <Reveal
              key={f.num}
              className="feat"
              delay={i % 3 === 0 ? undefined : `${(i % 3) * 0.06}s`}
            >
              <span className="num">{f.num}</span>
              <span className="fic">{f.icon}</span>
              <div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
