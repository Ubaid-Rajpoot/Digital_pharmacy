"use client";

import { useStore } from "@/components/StoreProvider";
import { IconCheck } from "@/components/icons";

export default function Toasts() {
  const { toasts } = useStore();

  return (
    <div className="toast-box" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <i>
            <IconCheck size={13} strokeWidth={3} />
          </i>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
