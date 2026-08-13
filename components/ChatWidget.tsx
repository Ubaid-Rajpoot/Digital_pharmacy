"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { IconChat, IconSend, IconX } from "@/components/icons";
import { pic } from "@/lib/products";

type Msg = { from: "bot" | "me"; text: string };

export default function ChatWidget() {
  const { chatOpen, setChatOpen } = useStore();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const openedOnce = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  // greet the user the first time the chat opens — timers are NOT cleared on
  // close so the greeting still lands even if the user opens & closes quickly
  useEffect(() => {
    if (!chatOpen || openedOnce.current) return;
    openedOnce.current = true;
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        { from: "bot", text: "Hello 💚 I'm Anika, a licensed pharmacist. How can I help you today?" },
      ]);
    }, 400);
    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        { from: "bot", text: "You can ask about medicines, dosages, refills or prescriptions." },
      ]);
    }, 1400);
  }, [chatOpen]);

  // keep the message list scrolled to the bottom
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, typing, chatOpen]);

  // Close the chat when the user clicks anywhere outside the panel and its
  // floating button, just like a dismissible popover.
  useEffect(() => {
    if (!chatOpen) return;

    const onOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !fabRef.current?.contains(target)
      ) {
        setChatOpen(false);
      }
    };

    document.addEventListener("pointerdown", onOutsidePointerDown);
    return () =>
      document.removeEventListener("pointerdown", onOutsidePointerDown);
  }, [chatOpen, setChatOpen]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    if (!v) return;
    setMsgs((m) => [...m, { from: "me", text: v }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [
        ...m,
        {
          from: "bot",
          text: "Thank you for sharing that. A licensed pharmacist is reviewing your message — meanwhile, would you like me to check availability in your area?",
        },
      ]);
    }, 1300);
  };

  return (
    <>
      <button
        ref={fabRef}
        className="chat-fab"
        aria-label="Chat with a pharmacist"
        onClick={() => setChatOpen(!chatOpen)}
      >
        <IconChat size={25} strokeWidth={2} />
      </button>
      <div ref={panelRef} className={`chat-panel${chatOpen ? " show" : ""}`}>
        <div className="chat-head">
          <img src={pic("pharmacist-anika", 84, 84)} alt="Pharmacist Anika" />
          <div>
            <b>Pharmacist Anika</b>
            <small>
              <i />
              Online · replies in ~30s
            </small>
          </div>
          <button aria-label="Close chat" onClick={() => setChatOpen(false)}>
            <IconX size={18} strokeWidth={2.2} />
          </button>
        </div>
        <div className="chat-body" ref={bodyRef}>
          {msgs.map((m, i) => (
            <div key={i} className={`msg ${m.from}`}>
              {m.text}
            </div>
          ))}
          {typing && (
            <div className="typing">
              <i />
              <i />
              <i />
            </div>
          )}
        </div>
        <form className="chat-form" onSubmit={send}>
          <input
            type="text"
            placeholder="Type your question..."
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" aria-label="Send">
            <IconSend size={17} strokeWidth={2} />
          </button>
        </form>
      </div>
    </>
  );
}
