// Central place for environment-derived settings and startup validation.
const isProd = () => process.env.NODE_ENV === "production";

export function checkEnv() {
  const missing = ["MONGO_URI", "JWT_SECRET"].filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(", ")} (see server/.env.example)`);
    process.exit(1);
  }
  if (isProd() && process.env.JWT_SECRET.length < 32) {
    console.error("JWT_SECRET must be at least 32 characters in production.");
    process.exit(1);
  }
  if (!isProd() && process.env.JWT_SECRET.length < 16) {
    console.warn("Warning: JWT_SECRET is short. Use a long random string (see server/.env.example).");
  }
}

export const clientOrigins = () =>
  (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((s) => s.trim().replace(/\/$/, ""));

export const primaryClientUrl = () => clientOrigins()[0];

export const COOKIE_NAME = "token";
export const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// httpOnly keeps the JWT away from JavaScript (XSS); Secure + SameSite are set per environment.
export function cookieOptions() {
  const sameSite = ["lax", "strict", "none"].includes(process.env.COOKIE_SAMESITE) ? process.env.COOKIE_SAMESITE : "lax";
  return {
    httpOnly: true,
    secure: isProd() || sameSite === "none",
    sameSite,
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  };
}
