// Static policy pages (delivery, returns, privacy, terms) rendered inside
// the storefront layout so they carry the site header/footer.

import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Policy = {
  title: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
};

const POLICIES: Record<string, Policy> = {
  delivery: {
    title: "Delivery Policy",
    intro:
      "Every Medora order is packed by a registered pharmacist and dispatched in tamper-evident, temperature-aware packaging. Here is exactly what happens after you place an order.",
    sections: [
      {
        heading: "Dispatch timelines",
        body: [
          "Orders placed before 2 PM are dispatched the same working day. Orders containing prescription medicines are dispatched only after our pharmacist has verified your uploaded prescription — this can add up to 6 working hours.",
          "You will receive an order confirmation immediately and a dispatch note with a tracking number once your parcel leaves our pharmacy.",
        ],
      },
      {
        heading: "Delivery speed & charges",
        body: [
          "Standard delivery reaches most pin codes in 2–4 working days and is free on orders of Rs 499 or more. Below that, a flat Rs 49 shipping fee applies.",
          "Cold-chain items (insulin, vaccines, some eye drops) travel in insulated boxes with gel packs and reach select cities within 24–48 hours.",
        ],
      },
      {
        heading: "Missed or delayed deliveries",
        body: [
          "If a courier attempts delivery while you are away, they will retry on the next working day. After two failed attempts the parcel returns to us and we refund the order in full.",
          "For any order delayed beyond 7 working days, contact care@medora.health or call 1800-MEDORA and we will trace it for you.",
        ],
      },
    ],
  },
  returns: {
    title: "Returns & Refunds",
    intro:
      "Medicines are sensitive products, so returns work differently here than at a regular store. These rules keep every parcel you receive genuinely safe.",
    sections: [
      {
        heading: "What can be returned",
        body: [
          "Damaged in transit, wrong item, or expiry-dated short of the promised window: we replace or refund in full, no questions asked. Share a photo within 48 hours of delivery.",
          "Unopened, non-prescription wellness products in their original seal can be returned within 7 days of delivery for a refund to the original payment method.",
        ],
      },
      {
        heading: "What cannot be returned",
        body: [
          "Opened prescription medicines, refrigerated (cold-chain) products, and test strips or devices whose hygiene seal is broken cannot be returned — this is a regulatory requirement.",
          "If such an item arrives damaged or incorrect, that is our fault, not a return: we replace it or refund it in full.",
        ],
      },
      {
        heading: "Refund timelines",
        body: [
          "Once a return is approved, refunds are initiated within 24 hours. Card and UPI refunds reflect in 3–5 working days; cash-on-delivery refunds are sent to your bank via NEFT within 5 working days.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro:
      "Your health data is among the most personal information you share with anyone. This policy explains what Medora collects, why, and the control you keep.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Order details (name, phone, email, delivery address), the contents of your cart and orders, prescriptions you upload, and anonymous usage analytics that help us fix what is broken.",
          "We never sell your data. Ever. We share the minimum needed to fulfil your order: your address with the courier, and your prescription with our licensed pharmacists.",
        ],
      },
      {
        heading: "Prescriptions & health data",
        body: [
          "Uploaded prescriptions are stored encrypted, visible only to registered pharmacists for verification and statutory record-keeping, and deleted when the law no longer requires us to keep them.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "Write to care@medora.health to access, correct, or delete your personal data, or to unsubscribe from marketing. We respond within 7 days.",
          "This is a demonstration store — data you enter here is stored only in this app's own database and is not shared with any third party.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro:
      "The ground rules for using Medora — written plainly, because legal language should not require a pharmacy degree.",
    sections: [
      {
        heading: "Using this service",
        body: [
          "You must be 18 or older to place an order. By using this site you confirm the information you provide, including prescriptions, is accurate and your own.",
          "Prescription medicines are dispensed only against a valid prescription from a registered medical practitioner, reviewed by our pharmacist before dispatch.",
        ],
      },
      {
        heading: "Pricing & availability",
        body: [
          "Prices shown include applicable taxes and are confirmed at checkout. If an item goes out of stock after you order, we cancel that line and refund it — we never substitute a medicine without your approval.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "Content on this site is for information only and is not medical advice. Always follow the guidance of your doctor or pharmacist. Medora's liability for any claim is limited to the value of the affected order.",
          "This is a demonstration store built to showcase a full e-pharmacy experience; no real transactions are processed.",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICIES[slug];
  return policy ? { title: `${policy.title} — Medora`, description: policy.intro } : {};
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();

  return (
    <section className="sec" style={{ paddingTop: 64 }}>
      <div className="wrap" style={{ maxWidth: 820 }}>
        <span className="eyebrow">Medora policies</span>
        <h1 className="h-display" style={{ fontSize: "clamp(30px,4vw,44px)", margin: "14px 0 12px" }}>
          {policy.title}
        </h1>
        <p className="sec-sub" style={{ fontSize: 16.5, lineHeight: 1.7 }}>{policy.intro}</p>

        <div style={{ display: "grid", gap: 26, marginTop: 40 }}>
          {policy.sections.map((s, i) => (
            <article
              key={s.heading}
              style={{
                background: "#fff",
                border: "1px solid var(--line2)",
                borderRadius: 18,
                padding: "26px 28px",
                boxShadow: "var(--shadow-s)",
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 30,
                    height: 30,
                    borderRadius: 10,
                    background: "var(--mint)",
                    color: "var(--green-d)",
                    fontSize: 13,
                    flex: "none",
                  }}
                >
                  {i + 1}
                </span>
                {s.heading}
              </h2>
              {s.body.map((p) => (
                <p key={p.slice(0, 40)} style={{ color: "var(--ink2)", lineHeight: 1.75, marginTop: 12 }}>
                  {p}
                </p>
              ))}
            </article>
          ))}
        </div>

        <p style={{ color: "var(--ink2)", fontSize: 13, marginTop: 34 }}>
          Questions about this policy? Call 1800-MEDORA (24×7, toll-free) or write to care@medora.health.
        </p>
      </div>
    </section>
  );
}
