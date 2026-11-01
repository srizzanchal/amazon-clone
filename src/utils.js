export const money = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const fmtDate = (d, withTime = false) =>
  new Date(d).toLocaleString("en-IN", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });

// Turns any axios/network error into a friendly message
export const errMsg = (e) =>
  e?.response?.data?.message ||
  (e?.request && !e?.response ? "Cannot reach the server. Is the backend running?" : e?.message) ||
  "Something went wrong";

export const load = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

// Display only - the server recalculates the real amounts (keep in sync with server/utils/pricing.js)
export const FREE_SHIPPING_ABOVE = 499;
export const SHIPPING_FEE = 40;
export const shippingFor = (itemsPrice) => (itemsPrice >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE);

export const ORDER_STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"];

// Client-side mirrors of the server validation, so users get instant feedback
export const PASSWORD_HINT = "At least 8 characters, with a letter and a number";
export const passwordError = (pw) =>
  pw.length < 8 ? "Password must be at least 8 characters" : !/[A-Za-z]/.test(pw) || !/\d/.test(pw) ? "Password needs a letter and a number" : "";

export const addressErrors = (a) => {
  const e = {};
  if (!a.fullName.trim()) e.fullName = "Enter the recipient's name";
  if (!/^(\+91)?[6-9]\d{9}$/.test(a.phone.replace(/[\s-]/g, ""))) e.phone = "Enter a valid 10-digit mobile number";
  if (!a.address.trim()) e.address = "Enter the street address";
  if (!a.city.trim()) e.city = "Enter the city";
  if (!/^\d{6}$/.test(a.postalCode.trim())) e.postalCode = "PIN code must be 6 digits";
  return e;
};

export const CATEGORY_ICONS = {
  Electronics: "🎧",
  Books: "📚",
  Fashion: "👕",
  "Home & Kitchen": "🍳",
  Sports: "🏋️",
};
export const categoryIcon = (name) => CATEGORY_ICONS[name] || "🛍️";

// Which statuses an admin may move an order to next (mirrors server/utils/orderFlow.js)
export const NEXT_STATUS = {
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};
