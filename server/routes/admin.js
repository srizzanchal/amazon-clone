import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";
import { STATUSES, canTransition } from "../utils/orderFlow.js";
import { escapeRegex, isObjectId, objectId, oneOf, queryNumber, text } from "../utils/validate.js";
import { applyStatus } from "../services/orders.js";

const router = express.Router();
router.use(protect, adminOnly);

const LOW_STOCK = 5;

/* ------------------------------- Stats ------------------------------- */

router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    // last 7 UTC days, oldest first
    const since = new Date(Date.now() - 6 * 86400000);
    since.setUTCHours(0, 0, 0, 0);
    // a "confirmed" order is not cancelled and is either paid or cash-on-delivery
    const confirmed = { status: { $ne: "Cancelled" }, $or: [{ isPaid: true }, { paymentMethod: "COD" }] };

    const [users, products, orders, byStatus, revenueAgg, daily, lowStock, recentOrders] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
      Order.aggregate([{ $match: { isPaid: true, status: { $ne: "Cancelled" } } }, { $group: { _id: null, total: { $sum: "$totalPrice" } } }]),
      Order.aggregate([
        { $match: { ...confirmed, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            orders: { $sum: 1 },
            value: { $sum: "$totalPrice" },
          },
        },
      ]),
      Product.find({ countInStock: { $lte: LOW_STOCK } }).sort({ countInStock: 1 }).limit(10).select("name countInStock image"),
      Order.find().sort({ createdAt: -1 }).limit(5).populate("user", "name email"),
    ]);

    const dailyMap = new Map(daily.map((d) => [d._id, d]));
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(since.getTime() + i * 86400000).toISOString().slice(0, 10);
      const d = dailyMap.get(date);
      return { date, orders: d?.orders || 0, value: d?.value || 0 };
    });

    res.json({
      users,
      products,
      orders,
      revenue: revenueAgg[0]?.total || 0, // collected: paid orders (COD counts once delivered)
      ordersByStatus: Object.fromEntries(STATUSES.map((s) => [s, byStatus.find((b) => b._id === s)?.n || 0])),
      last7Days,
      lowStock,
      lowStockThreshold: LOW_STOCK,
      recentOrders,
    });
  })
);

/* ------------------------------- Orders ------------------------------- */

router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Math.floor(queryNumber(req.query.limit)) || 15, 1), 50);
    const page = Math.max(Math.floor(queryNumber(req.query.page)) || 1, 1);
    const filter = {};
    if (typeof req.query.status === "string" && req.query.status) filter.status = oneOf(req.query.status, "Status", STATUSES);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("user", "name email"),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, page, pages: Math.max(Math.ceil(total / limit), 1), total });
  })
);

router.put(
  "/orders/:id/status",
  asyncHandler(async (req, res) => {
    const status = oneOf(req.body.status, "Status", STATUSES);
    const order = isObjectId(req.params.id) ? await Order.findById(req.params.id) : null;
    if (!order) throw new HttpError(404, "Order not found");
    if (!canTransition(order.status, status)) throw new HttpError(400, `Cannot change an order from ${order.status} to ${status}`);
    if (status === "Shipped" && order.paymentMethod === "Stripe" && !order.isPaid) {
      throw new HttpError(400, "A card order must be paid before it can be shipped");
    }
    await applyStatus(order, status);
    await order.populate("user", "name email");
    res.json(order);
  })
);

/* ----------------------------- Categories ----------------------------- */

router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const [categories, counts] = await Promise.all([
      Category.find().sort({ name: 1 }),
      Product.aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }]),
    ]);
    const countMap = new Map(counts.map((c) => [c._id, c.n]));
    res.json(categories.map((c) => ({ _id: c._id, name: c.name, productCount: countMap.get(c.name) || 0 })));
  })
);

const dupeCheck = async (name, exceptId) => {
  const existing = await Category.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, "i") });
  if (existing && String(existing._id) !== String(exceptId)) throw new HttpError(409, "That category already exists");
};

router.post(
  "/categories",
  asyncHandler(async (req, res) => {
    const name = text(req.body.name, "Category name", { max: 60 });
    await dupeCheck(name);
    res.status(201).json(await Category.create({ name }));
  })
);

router.put(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    objectId(req.params.id, "category id");
    const name = text(req.body.name, "Category name", { max: 60 });
    const category = await Category.findById(req.params.id);
    if (!category) throw new HttpError(404, "Category not found");
    await dupeCheck(name, category._id);
    const oldName = category.name;
    category.name = name;
    await category.save();
    await Product.updateMany({ category: oldName }, { category: name }); // keep products in sync with the rename
    res.json(category);
  })
);

router.delete(
  "/categories/:id",
  asyncHandler(async (req, res) => {
    objectId(req.params.id, "category id");
    const category = await Category.findById(req.params.id);
    if (!category) throw new HttpError(404, "Category not found");
    if (await Product.exists({ category: category.name })) {
      throw new HttpError(409, "Move or delete the products in this category first");
    }
    await category.deleteOne();
    res.json({ message: "Category deleted" });
  })
);

export default router;
