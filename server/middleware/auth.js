import jwt from "jsonwebtoken";
import User from "../models/User.js";
import asyncHandler from "./asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { COOKIE_NAME } from "../config/env.js";

// Reads the JWT from the httpOnly cookie (browser) or an "Authorization: Bearer" header (API clients).
function readToken(req) {
  if (req.cookies?.[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export const protect = asyncHandler(async (req, res, next) => {
  const token = readToken(req);
  if (!token) throw new HttpError(401, "Not authorized, please sign in");
  let id;
  try {
    ({ id } = jwt.verify(token, process.env.JWT_SECRET));
  } catch {
    throw new HttpError(401, "Session expired, please sign in again");
  }
  req.user = await User.findById(id);
  if (!req.user) throw new HttpError(401, "User no longer exists");
  next();
});

// Role check; always used after `protect`.
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") return next(new HttpError(403, "Admin access required"));
  next();
};
