"use client";

import Reveal from "@/components/Reveal";
import { useStore } from "@/components/StoreProvider";
import { IconArrow, IconChat, IconCheck, IconHeart } from "@/components/icons";
import { pic } from "@/lib/products";

export default function ConsultSection() {
  const { setChatOpen, toast } = useStore();

  return (
    <section className="sec" id="consult" style={{ paddingTop: 40 }}>
      <div className="wrap">
        <Reveal className="consult-panel">
          <div className="consult-img">
            <img
              src={pic("doctor-friendly-portrait", 760, 900)}
              alt="Dr. Amara Osei, consulting pharmacist"
              loading="lazy"
            />
            <div className="doc-status">
              <img src={pic("pharmacist-avatar-warm", 96, 96)} alt="" />
              <div>
                <b>Dr. Amara Osei</b>
                <small>Senior Pharmacist · 14 yrs experience</small>
              </div>
              <span className="online-dot">
                <i />
                Online
              </span>
            </div>
          </div>
          <div className="consult-body">
            <span className="eyebrow">Free guidance, always</span>
            <h2 className="h-display">
              Not sure what you need?{" "}
              <em style={{ fontStyle: "italic", color: "#8CE8BE" }}>
                Talk to our healthcare experts.
              </em>
            </h2>
            <p>
              Whether it&apos;s a confusing prescription, a worried midnight
              question, or choosing between two supplements — our licensed
              pharmacists and partner doctors are one tap away.
            </p>
            <ul className="consult-points">
              <li>
                <i>
                  <IconCheck size={12} strokeWidth={3} />
                </i>
                Average response under 60 seconds
              </li>
              <li>
                <i>
                  <IconCheck size={12} strokeWidth={3} />
                </i>
                Licensed pharmacists &amp; MBBS partner doctors
              </li>
              <li>
                <i>
                  <IconCheck size={12} strokeWidth={3} />
                </i>
                Private, encrypted health conversations
              </li>
            </ul>
            <div className="consult-ctas">
              <button
                className="btn btn-white"
                onClick={() =>
                  toast("Consultation slot held — our doctor will confirm by SMS 🩺")
                }
              >
                Book Consultation <IconArrow size={16} strokeWidth={2.4} />
              </button>
              <button className="btn btn-outline-w" onClick={() => setChatOpen(true)}>
                <IconChat size={17} strokeWidth={2} />
                Chat With Expert
              </button>
            </div>
            <p className="consult-note">
              <IconHeart size={15} strokeWidth={2} />
              Free with every order · No appointment needed for chat
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
