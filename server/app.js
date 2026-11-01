import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import wishlistRoutes from "./routes/wishlist.js";
import addressRoutes from "./routes/addresses.js";
import adminRoutes from "./routes/admin.js";
import sanitize from "./middleware/sanitize.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/error.js";
import { clientOrigins } from "./config/env.js";

const app = express();

app.set("trust proxy", 1); // behind Render/Vercel proxies: correct client IPs for rate limiting + secure cookies
app.use(helmet());
app.use(cors({ origin: clientOrigins(), credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(sanitize);
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.get("/", (req, res) => res.json({ status: "ok", service: "amazon-clone-api" })); // health check for Render
app.get("/api/health", (req, res) =>
  res.json({
    api: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    cardPayments: Boolean(process.env.STRIPE_SECRET_KEY), // lets the UI hide card checkout when Stripe isn't configured
  })
);

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
