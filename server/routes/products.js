import express from "express";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { recalcProductRating } from "../services/reviews.js";
import { HttpError } from "../utils/httpError.js";
import { escapeRegex, imageUrl, isObjectId, number, objectId, queryNumber, text } from "../utils/validate.js";

const router = express.Router();

// _id is a tiebreaker so pagination stays stable when many products share a value
const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  "price-asc": { price: 1, _id: 1 },
  "price-desc": { price: -1, _id: 1 },
  rating: { rating: -1, numReviews: -1, _id: 1 },
  popular: { sold: -1, numReviews: -1, _id: 1 },
};

// GET /api/products?keyword=&category=&minPrice=&maxPrice=&rating=&inStock=1&sort=&page=&limit=
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { keyword, category, sort, inStock } = req.query;
    const limit = Math.min(Math.max(Math.floor(queryNumber(req.query.limit)) || 12, 1), 48);
    const page = Math.max(Math.floor(queryNumber(req.query.page)) || 1, 1);

    const filter = {};
    if (typeof keyword === "string" && keyword.trim()) {
      const re = new RegExp(escapeRegex(keyword.trim().slice(0, 100)), "i");
      filter.$or = [{ name: re }, { brand: re }, { category: re }, { description: re }];
    }
    if (typeof category === "string" && category) filter.category = category;
    const min = queryNumber(req.query.minPrice);
    const max = queryNumber(req.query.maxPrice);
    if (min !== undefined || max !== undefined) {
      filter.price = {};
      if (min !== undefined) filter.price.$gte = min;
      if (max !== undefined) filter.price.$lte = max;
    }
    const rating = queryNumber(req.query.rating);
    if (rating !== undefined) filter.rating = { $gte: rating };
    if (inStock === "1") filter.countInStock = { $gt: 0 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(SORTS[sort] || SORTS.newest)
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);
    res.json({ products, page, pages: Math.max(Math.ceil(total / limit), 1), total });
  })
);

// Category names: managed categories plus any category already used by a product
router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const [managed, used] = await Promise.all([Category.find().select("name"), Product.distinct("category")]);
    const names = new Set([...managed.map((c) => c.name), ...used]);
    res.json([...names].sort((a, b) => a.localeCompare(b)));
  })
);

// GET /api/products/by-ids?ids=a,b,c  (used by the cart to refresh prices and stock)
router.get(
  "/by-ids",
  asyncHandler(async (req, res) => {
    const ids = String(req.query.ids || "").split(",").filter(isObjectId).slice(0, 50);
    res.json(ids.length ? await Product.find({ _id: { $in: ids } }) : []);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = isObjectId(req.params.id) ? await Product.findById(req.params.id) : null;
    if (!product) throw new HttpError(404, "Product not found");
    res.json(product);
  })
);

/* ------------------------------ Reviews ------------------------------ */

router.get(
  "/:id/reviews",
  asyncHandler(async (req, res) => {
    objectId(req.params.id, "product id");
    res.json(await Review.find({ product: req.params.id }).sort({ createdAt: -1 }).limit(100));
  })
);

// Create or update the signed-in user's review (one per product)
router.post(
  "/:id/reviews",
  protect,
  asyncHandler(async (req, res) => {
    objectId(req.params.id, "product id");
    if (!(await Product.exists({ _id: req.params.id }))) throw new HttpError(404, "Product not found");
    const rating = number(req.body.rating, "Rating", { min: 1, max: 5, integer: true });
    const comment = text(req.body.comment, "Comment", { required: false, max: 1000 });

    // "Verified purchase" = the user has a non-cancelled, paid-or-COD order containing this product
    const verified = !!(await Order.exists({
      user: req.user._id,
      "items.product": req.params.id,
      status: { $ne: "Cancelled" },
      $or: [{ isPaid: true }, { paymentMethod: "COD" }],
    }));

    const review = await Review.findOneAndUpdate(
      { product: req.params.id, user: req.user._id },
      { rating, comment, name: req.user.name, verified },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
    await recalcProductRating(req.params.id);
    res.status(201).json(review);
  })
);

router.delete(
  "/:id/reviews",
  protect,
  asyncHandler(async (req, res) => {
    objectId(req.params.id, "product id");
    await Review.deleteOne({ product: req.params.id, user: req.user._id });
    await recalcProductRating(req.params.id);
    res.json({ message: "Review removed" });
  })
);

/* ------------------------- Admin: product CRUD ------------------------- */

async function parseProduct(body) {
  const data = {
    name: text(body.name, "Name", { max: 200 }),
    image: imageUrl(body.image),
    brand: text(body.brand, "Brand", { required: false, max: 100 }),
    category: text(body.category, "Category", { max: 60 }),
    description: text(body.description, "Description", { required: false, max: 5000 }),
    price: number(body.price, "Price", { min: 0, max: 10_000_000 }),
    countInStock: number(body.countInStock, "Stock", { min: 0, max: 1_000_000, integer: true }),
  };
  if (!(await Category.exists({ name: data.category }))) throw new HttpError(400, "Choose an existing category");
  return data;
}

router.post(
  "/",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => res.status(201).json(await Product.create(await parseProduct(req.body))))
);

router.put(
  "/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    objectId(req.params.id, "product id");
    const product = await Product.findByIdAndUpdate(req.params.id, await parseProduct(req.body), {
      new: true,
      runValidators: true,
    });
    if (!product) throw new HttpError(404, "Product not found");
    res.json(product);
  })
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    objectId(req.params.id, "product id");
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw new HttpError(404, "Product not found");
    // clean up everything that points at the product (past orders keep their own snapshot of name/price)
    await Promise.all([
      Review.deleteMany({ product: product._id }),
      User.updateMany({}, { $pull: { wishlist: product._id } }),
    ]);
    res.json({ message: "Product deleted" });
  })
);

export default router;
