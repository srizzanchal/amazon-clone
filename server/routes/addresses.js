import express from "express";
import User from "../models/User.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";
import { objectId, shippingAddress } from "../utils/validate.js";

const router = express.Router();
router.use(protect);

const MAX_ADDRESSES = 10;

// Only one address can be the default
const applyDefault = (user, keepId) => {
  user.addresses.forEach((a) => {
    a.isDefault = String(a._id) === String(keepId);
  });
};

router.get(
  "/",
  asyncHandler(async (req, res) => res.json(req.user.addresses))
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = shippingAddress(req.body);
    if (req.user.addresses.length >= MAX_ADDRESSES) throw new HttpError(400, `You can save up to ${MAX_ADDRESSES} addresses`);
    req.user.addresses.push({ ...data, isDefault: req.user.addresses.length === 0 || req.body.isDefault === true });
    const added = req.user.addresses[req.user.addresses.length - 1];
    if (added.isDefault) applyDefault(req.user, added._id);
    await req.user.save();
    res.status(201).json(req.user.addresses);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    objectId(req.params.id, "address id");
    const addr = req.user.addresses.id(req.params.id);
    if (!addr) throw new HttpError(404, "Address not found");
    addr.set(shippingAddress(req.body));
    if (req.body.isDefault === true) applyDefault(req.user, addr._id);
    await req.user.save();
    res.json(req.user.addresses);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    objectId(req.params.id, "address id");
    const addr = req.user.addresses.id(req.params.id);
    if (!addr) throw new HttpError(404, "Address not found");
    const wasDefault = addr.isDefault;
    addr.deleteOne();
    if (wasDefault && req.user.addresses.length) req.user.addresses[0].isDefault = true;
    await req.user.save();
    res.json(req.user.addresses);
  })
);

export default router;
