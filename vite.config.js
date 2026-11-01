import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development, /api/* is forwarded to the Express server, so the browser sees ONE origin:
// no CORS setup and the httpOnly auth cookie "just works".
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:5000" } },
});
