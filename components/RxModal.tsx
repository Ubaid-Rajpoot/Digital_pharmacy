"use client";

import { useRef, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { IconCheck, IconRx, IconX } from "@/components/icons";

export default function RxModal() {
  const { rxOpen, setRxOpen } = useStore();
  const [fileName, setFileName] = useState("Drag & drop your prescription");
  const [over, setOver] = useState(false);
  const [done, setDone] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // reset the form each time the modal opens (adjust state during render
  // rather than in an effect — the React-recommended pattern)
  const [prevRxOpen, setPrevRxOpen] = useState(rxOpen);
  if (prevRxOpen !== rxOpen) {
    setPrevRxOpen(rxOpen);
    if (rxOpen) {
      setDone(false);
      setFileName("Drag & drop your prescription");
    }
  }

  if (!rxOpen) return null;

  const close = () => setRxOpen(false);

  return (
    <div
      className="modal-wrap show"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "rxModal") close();
      }}
      id="rxModal"
    >
      <div className="modal rx-modal">
        <button className="icon-x modal-x" onClick={close} aria-label="Close">
          <IconX size={17} strokeWidth={2.2} />
        </button>
        {!done ? (
          <div>
            <span className="eyebrow">Upload Prescription</span>
            <h3 className="h-display" style={{ fontSize: 26, marginTop: 12 }}>
              Send us your Rx — we&apos;ll take it from here.
            </h3>
            <div
              className={`rx-drop${over ? " over" : ""}`}
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(true);
              }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                if (e.dataTransfer.files[0]) setFileName(e.dataTransfer.files[0].name);
              }}
            >
              <IconRx size={36} strokeWidth={1.7} />
              <p className="big" style={{ margin: "12px 0 4px" }}>
                {fileName}
              </p>
              <small>or click to browse · JPG, PNG, PDF up to 10 MB</small>
              <input
                type="file"
                hidden
                accept="image/*,.pdf"
                ref={fileInput}
                onChange={(e) => {
                  if (e.target.files?.[0]) setFileName(e.target.files[0].name);
                }}
              />
            </div>
            <div className="rx-fields">
              <input type="text" placeholder="Patient name" required />
              <input
                type="tel"
                placeholder="Phone number (for pharmacist verification)"
                required
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 16 }}
              onClick={() => setDone(true)}
            >
              Submit for Verification
            </button>
            <p
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "var(--ink3)",
                marginTop: 14,
                fontWeight: 600,
              }}
            >
              A registered pharmacist reviews every prescription within 15
              minutes.
            </p>
          </div>
        ) : (
          <div className="rx-done show">
            <div className="ok">
              <IconCheck size={34} strokeWidth={2.6} />
            </div>
            <h3 className="h-display" style={{ fontSize: 24 }}>
              Prescription received 💙
            </h3>
            <p style={{ color: "var(--ink2)", margin: "10px 0 22px", fontSize: 14.5 }}>
              Our pharmacist is reviewing it now. We&apos;ll confirm by SMS
              within 15 minutes and deliver with full care.
            </p>
            <button className="btn btn-ghost" onClick={close}>
              Continue Browsing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
