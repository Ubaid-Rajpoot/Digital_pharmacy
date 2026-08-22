"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import { useStore } from "@/components/StoreProvider";
import { IconArrow, IconChat, IconCheck, IconHeart } from "@/components/icons";
import { pic } from "@/lib/products";

const SPECIALTIES = ["General Medicine", "Diabetes Care", "Cardiology", "Pediatrics", "Skin & Dermatology", "Women's Health"];
const SLOTS = ["Morning (9–12)", "Afternoon (12–4)", "Evening (4–8)", "Any time works"];

function BookingForm({ onDone }: { onDone: () => void }) {
  const { toast } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3 || phone.replace(/\D/g, "").length < 10) {
      toast("Please add your name and a valid phone number");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/store/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, specialty, slot }),
      });
      const data = await res.json();
      if (!res.ok) toast(data.error ?? "Couldn't book that — please try again");
      else {
        toast("Consultation request sent — our care team will confirm shortly 🩺");
        onDone();
      }
    } catch {
      toast("Network hiccup — please try again");
    } finally {
      setBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 11, border: 0,
    fontSize: 14, fontFamily: "inherit", outline: "none", background: "#fff",
  };

  return (
    <form
      onSubmit={submit}
      style={{
        marginTop: 18, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.22)",
        borderRadius: 16, padding: "16px 18px", display: "grid", gap: 10,
        gridTemplateColumns: "1fr 1fr",
      }}
    >
      <input style={inputStyle} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      <input style={inputStyle} placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
      <select style={inputStyle} value={specialty} onChange={(e) => setSpecialty(e.target.value)} aria-label="Specialty">
        {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
      </select>
      <select style={inputStyle} value={slot} onChange={(e) => setSlot(e.target.value)} aria-label="Preferred slot">
        {SLOTS.map((s) => <option key={s}>{s}</option>)}
      </select>
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="submit" className="btn btn-white" style={{ padding: "11px 20px", fontSize: 14 }} disabled={busy}>
          {busy ? "Booking…" : "Confirm request"}
        </button>
      </div>
    </form>
  );
}

export default function ConsultSection() {
  const { setChatOpen } = useStore();
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

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
                onClick={() => {
                  if (booked) return;
                  setBooking((v) => !v);
                }}
                disabled={booked}
              >
                {booked ? (
                  "Request sent ✓"
                ) : booking ? (
                  "Close booking form"
                ) : (
                  <>
                    Book Consultation <IconArrow size={16} strokeWidth={2.4} />
                  </>
                )}
              </button>
              <button className="btn btn-outline-w" onClick={() => setChatOpen(true)}>
                <IconChat size={17} strokeWidth={2} />
                Chat With Expert
              </button>
            </div>
            {booking && !booked && (
              <BookingForm
                onDone={() => {
                  setBooking(false);
                  setBooked(true);
                }}
              />
            )}
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
