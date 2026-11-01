import axios from "axios";

// withCredentials: the JWT lives in an httpOnly cookie, so the browser must send it with every request.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api", withCredentials: true });

// If a protected call comes back 401 (cookie expired/invalid), tell the app so it can sign the user out.
// /auth/* is excluded: a 401 there just means "wrong password" or "not signed in yet".
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !String(err.config?.url || "").startsWith("/auth/")) {
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(err);
  }
);

export default api;
