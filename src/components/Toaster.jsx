import { useSyncExternalStore } from "react";
import { dismiss, getToasts, subscribe } from "../toast";

const ICONS = { success: "✓", error: "!", info: "i" };

// Renders the toast notifications triggered via toast.success / toast.error / toast.info
export default function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getToasts);
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{ICONS[t.type]}</span>
          <span className="toast-msg">{t.message}</span>
          <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">×</button>
        </div>
      ))}
    </div>
  );
}
