import Reveal from "@/components/Reveal";
import { pic } from "@/lib/products";

export default function CareSection() {
  return (
    <section className="sec" id="care">
      <div className="wrap">
        <div className="sec-head">
          <Reveal>
            <span className="eyebrow">Why families stay with us</span>
            <h2 className="h-display">
              We don&apos;t just deliver medicines.{" "}
              <em className="leaf">We deliver care.</em>
            </h2>
          </Reveal>
          <Reveal delay=".15s">
            <p className="side">
              Behind every order is someone&apos;s parent, child, or partner.
              That&apos;s why we treat every delivery like it&apos;s for our own
              family — because to someone, it is.
            </p>
          </Reveal>
        </div>
        <div className="care-grid">
          <Reveal className="care-card cc-a">
            <div className="img">
              <img
                src={pic("elderly-parents-care", 1000, 560)}
                alt="Elderly couple receiving their monthly medicines"
                loading="lazy"
              />
            </div>
            <div className="body">
              <span className="tag tag-blue">Quality you can trust</span>
              <h3>Every tablet traced to its source</h3>
              <p>
                We procure directly from licensed manufacturers, verify every
                batch, and reject anything that doesn&apos;t meet our standard.
                If we wouldn&apos;t give it to our own parents, we won&apos;t
                send it to yours.
              </p>
            </div>
          </Reveal>
          <Reveal delay=".1s" className="care-card cc-b mini">
            <div className="body">
              <span className="tag tag-mint">Healthcare at your doorstep</span>
              <h3>From our pharmacy to your pillow — gently</h3>
              <p>
                Temperature-controlled vans, careful handlers, and delivery
                partners trained to knock softly and wait patiently.
              </p>
              <div className="care-quote">
                &quot;The delivery brother waits till my mother signs. That
                small patience means everything.&quot;
              </div>
            </div>
          </Reveal>
          <Reveal delay=".18s" className="care-card cc-c mini">
            <div className="body">
              <span className="tag tag-blue">Your family&apos;s wellness partner</span>
              <h3>We remember so you don&apos;t have to</h3>
              <p>
                Refill reminders before you run out, dosage guides in your
                language, and one pharmacist who knows your family&apos;s
                history.
              </p>
              <div className="care-photo-strip">
                <img src={pic("child-wellness", 100, 100)} alt="Child" loading="lazy" />
                <img src={pic("mother-care-portrait", 100, 100)} alt="Mother" loading="lazy" />
                <img src={pic("grandfather-smile", 100, 100)} alt="Grandfather" loading="lazy" />
                <span className="more">2.4M</span>
              </div>
            </div>
          </Reveal>
          <Reveal delay=".1s" className="care-card cc-d">
            <div className="img">
              <img
                src={pic("pharmacist-night-shift", 1000, 560)}
                alt="Pharmacist working late to prepare an order"
                loading="lazy"
              />
            </div>
            <div className="body">
              <span className="tag tag-mint">Always here when you need us</span>
              <h3>3 AM fever? We&apos;re still awake.</h3>
              <p>
                Night-time orders, emergency deliveries, and real humans on the
                phone at every hour. Illness doesn&apos;t keep office hours —
                neither do we.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
