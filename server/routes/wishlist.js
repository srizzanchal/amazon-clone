import express from "express";
import User from "../models/User.js";
import Product from "../models/Product.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";
import { objectId } from "../utils/validate.js";

const router = express.Router();
router.use(protect);

const sendWishlist = async (userId, res, status = 200) => {
  const user = await User.findById(userId).populate("wishlist");
  res.status(status).json(user.wishlist.filter(Boolean));
};

router.get("/", asyncHandler(async (req, res) => sendWishlist(req.user._id, res)));

router.post(
  "/:productId",
  asyncHandler(async (req, res) => {
    objectId(req.params.productId, "product id");
    if (!(await Product.exists({ _id: req.params.productId }))) throw new HttpError(404, "Product not found");
    await User.updateOne({ _id: req.user._id }, { $addToSet: { wishlist: req.params.productId } });
    await sendWishlist(req.user._id, res, 201);
  })
);

router.delete(
  "/:productId",
  asyncHandler(async (req, res) => {
    objectId(req.params.productId, "product id");
    await User.updateOne({ _id: req.user._id }, { $pull: { wishlist: req.params.productId } });
    await sendWishlist(req.user._id, res);
  })
);

export default router;
