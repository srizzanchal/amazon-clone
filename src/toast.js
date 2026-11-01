// Tiny toast notification store (no dependency). <Toaster /> renders it; call toast.success("...") anywhere.
let toasts = [];
let nextId = 0;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getToasts = () => toasts; // reference only changes when the list changes (needed by useSyncExternalStore)

export const dismiss = (id) => {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
};

const add = (type, message, ms = 3500) => {
  const id = ++nextId;
  toasts = [...toasts, { id, type, message }].slice(-4);
  emit();
  setTimeout(() => dismiss(id), ms);
};

export const toast = {
  success: (m) => add("success", m),
  error: (m) => add("error", m, 5000),
  info: (m) => add("info", m),
};
