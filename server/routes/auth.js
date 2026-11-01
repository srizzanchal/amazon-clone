import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { HttpError } from "../utils/httpError.js";
import { email as validEmail, password as validPassword, text } from "../utils/validate.js";
import { COOKIE_NAME, cookieOptions } from "../config/env.js";

const router = express.Router();

const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role });

// Issues the session: JWT goes into an httpOnly cookie, the body only carries the public profile.
function startSession(res, user, status = 200) {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.status(status).json(publicUser(user));
}

router.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const name = text(req.body.name, "Name", { max: 100 });
    const email = validEmail(req.body.email);
    const password = validPassword(req.body.password);
    if (await User.findOne({ email })) throw new HttpError(409, "Email already registered");
    // role is never read from the request body: new accounts are always customers
    const user = await User.create({ name, email, password });
    startSession(res, user, 201);
  })
);

router.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const user = email ? await User.findOne({ email }).select("+password") : null;
    // same message for unknown email and wrong password so accounts can't be enumerated
    if (!user || !(await user.matchPassword(password))) throw new HttpError(401, "Invalid email or password");
    startSession(res, user);
  })
);

router.post("/logout", (req, res) => {
  const { maxAge, ...opts } = cookieOptions(); // clearCookie needs the same attributes minus maxAge
  res.clearCookie(COOKIE_NAME, opts);
  res.json({ message: "Signed out" });
});

router.get("/me", protect, (req, res) => res.json(publicUser(req.user)));

export default router;
