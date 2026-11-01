import rateLimit from "express-rate-limit";

const isProd = process.env.NODE_ENV === "production";
const handler = (message) => ({ message });

// Broad limit for the whole API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: handler("Too many requests, please try again later"),
});

// Tight limit for login/register to slow down credential stuffing and brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: handler("Too many sign-in attempts, please try again in a few minutes"),
});
