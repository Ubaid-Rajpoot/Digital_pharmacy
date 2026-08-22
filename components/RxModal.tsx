"use client";

import { useRef, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { IconCheck, IconRx, IconX } from "@/components/icons";

export default function RxModal() {
  const { rxOpen, setRxOpen, rx, setRx, toast } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("Drag & drop your prescription");
  const [patient, setPatient] = useState("");
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // reset the form each time the modal opens (adjust state during render
  // rather than in an effect — the React-recommended pattern)
  const [prevRxOpen, setPrevRxOpen] = useState(rxOpen);
  if (prevRxOpen !== rxOpen) {
    setPrevRxOpen(rxOpen);
    if (rxOpen) {
      setDone(false);
      setError("");
      setBusy(false);
      setFile(null);
      setFileName("Drag & drop your prescription");
    }
  }

  if (!rxOpen) return null;

  const close = () => setRxOpen(false);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError("That file is over 10 MB — please upload a smaller photo or PDF.");
      return;
    }
    setError("");
    setFile(f);
    setFileName(f.name);
  };

  const submit = async () => {
    if (!file) {
      setError("Please choose a photo or PDF of your prescription first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      if (patient) form.append("patient", patient);
      const res = await fetch("/api/store/prescription", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed — please try again.");
        return;
      }
      setRx({ url: data.url, name: data.name });
      setDone(true);
      toast("Prescription attached to your care bag 📎");
    } catch {
      setError("Network hiccup — please try again.");
    } finally {
      setBusy(false);
    }
  };

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
                pick(e.dataTransfer.files[0]);
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
                onChange={(e) => pick(e.target.files?.[0])}
              />
            </div>
            <div className="rx-fields">
              <input
                type="text"
                placeholder="Patient name (optional)"
                value={patient}
                onChange={(e) => setPatient(e.target.value)}
                maxLength={60}
              />
            </div>
            {error && (
              <p style={{ color: "#d84b4b", fontSize: 13, fontWeight: 600, margin: "10px 2px 0" }}>{error}</p>
            )}
            {rx && !file && (
              <p style={{ fontSize: 12.5, color: "var(--ink2)", margin: "12px 2px 0" }}>
                Currently attached: <b>{rx.name}</b> — uploading a new file will replace it.
              </p>
            )}
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 16 }}
              onClick={() => void submit()}
              disabled={busy}
            >
              {busy ? "Uploading securely…" : "Submit for Verification"}
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
              It&apos;s attached to your care bag and will be verified by a pharmacist
              when you place your order. Add your medicines and check out whenever
              you&apos;re ready.
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
