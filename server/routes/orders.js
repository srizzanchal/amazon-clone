import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { getStripe, createCheckoutSession } from "../utils/stripe.js";
import { HttpError } from "../utils/httpError.js";
import { calcTotals } from "../utils/pricing.js";
import { customerCanCancel } from "../utils/orderFlow.js";
import { isObjectId, number, objectId, oneOf, queryNumber, shippingAddress } from "../utils/validate.js";
import { releaseStock, reserveStock } from "../services/stock.js";
import { applyStatus } from "../services/orders.js";

const router = express.Router();
router.use(protect);

async function getOwnOrder(req) {
  const order = isObjectId(req.params.id) ? await Order.findById(req.params.id) : null;
  if (!order || String(order.user) !== String(req.user._id)) throw new HttpError(404, "Order not found");
  return order;
}

// Create an order. Prices come from the DB (never the browser). COD reserves stock immediately;
// card orders reserve stock once Stripe confirms the payment.
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { items, shippingAddress: rawAddress, paymentMethod } = req.body;
    if (!Array.isArray(items) || !items.length) throw new HttpError(400, "Your cart is empty");
    if (items.length > 50) throw new HttpError(400, "Too many items in one order");
    const address = shippingAddress(rawAddress);
    oneOf(paymentMethod, "Payment method", ["Stripe", "COD"]);

    // merge duplicate lines of the same product
    const wanted = new Map();
    for (const line of items) {
      const id = objectId(line?.product, "product id");
      const qty = number(line.qty, "Quantity", { min: 1, max: 100, integer: true });
      wanted.set(id, (wanted.get(id) || 0) + qty);
    }
    if (paymentMethod === "Stripe") getStripe(); // fail early if Stripe isn't configured

    const products = await Product.find({ _id: { $in: [...wanted.keys()] } });
    const byId = new Map(products.map((p) => [String(p._id), p]));
    const orderItems = [...wanted].map(([id, qty]) => {
      const p = byId.get(id);
      if (!p) throw new HttpError(400, "A product in your cart is no longer available");
      if (qty > p.countInStock) {
        throw new HttpError(409, p.countInStock ? `Only ${p.countInStock} left of "${p.name}"` : `"${p.name}" is out of stock`);
      }
      return { product: p._id, name: p.name, image: p.image, price: p.price, qty };
    });

    const isCOD = paymentMethod === "COD";
    if (isCOD) await reserveStock(orderItems);

    let order;
    try {
      order = await Order.create({
        user: req.user._id,
        items: orderItems,
        shippingAddress: address,
        paymentMethod,
        ...calcTotals(orderItems),
        stockDeducted: isCOD,
        statusHistory: [{ status: "Processing" }],
      });
    } catch (err) {
      if (isCOD) await releaseStock(orderItems);
      throw err;
    }
    if (isCOD) return res.status(201).json({ order });

    try {
      const checkoutUrl = await createCheckoutSession(order, req.user);
      res.status(201).json({ order, checkoutUrl });
    } catch (err) {
      await order.deleteOne(); // don't leave an unpayable order behind
      throw err;
    }
  })
);

// Order history (paginated)
router.get(
  "/mine",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Math.floor(queryNumber(req.query.limit)) || 10, 1), 50);
    const page = Math.max(Math.floor(queryNumber(req.query.page)) || 1, 1);
    const filter = { user: req.user._id };
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, page, pages: Math.max(Math.ceil(total / limit), 1), total });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => res.json(await getOwnOrder(req)))
);

// Customer cancellation (only while the order is still Processing); stock is restored
router.put(
  "/:id/cancel",
  asyncHandler(async (req, res) => {
    const order = await getOwnOrder(req);
    if (!customerCanCancel(order)) throw new HttpError(400, "This order can no longer be cancelled");
    res.json(await applyStatus(order, "Cancelled"));
  })
);

// Start a fresh Stripe session for an unpaid card order
router.post(
  "/:id/pay",
  asyncHandler(async (req, res) => {
    const order = await getOwnOrder(req);
    if (order.isPaid || order.paymentMethod !== "Stripe" || order.status === "Cancelled") {
      throw new HttpError(400, "This order does not need a card payment");
    }
    res.json({ checkoutUrl: await createCheckoutSession(order, req.user) });
  })
);

// Called by the client after Stripe redirects back; the server confirms with Stripe, not the browser
router.post(
  "/:id/verify-payment",
  asyncHandler(async (req, res) => {
    const order = await getOwnOrder(req);
    if (order.isPaid) return res.json(order);

    const { sessionId } = req.body;
    if (order.paymentMethod !== "Stripe" || !sessionId || sessionId !== order.stripeSessionId) {
      throw new HttpError(400, "Invalid payment session");
    }
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" || session.metadata?.orderId !== String(order._id)) {
      throw new HttpError(400, "Payment was not completed");
    }
    // Atomic flip so duplicate calls can't reserve stock twice
    const paid = await Order.findOneAndUpdate(
      { _id: order._id, isPaid: false },
      { isPaid: true, paidAt: new Date() },
      { new: true }
    );
    if (paid) {
      try {
        await reserveStock(paid.items);
        paid.stockDeducted = true;
      } catch {
        paid.notes = "Paid, but stock ran out before payment was confirmed - refund or restock.";
      }
      await paid.save();
    }
    res.json(paid || (await Order.findById(order._id)));
  })
);

export default router;
