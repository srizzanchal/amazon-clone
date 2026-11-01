import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: String,
        image: String,
        price: Number,
        qty: Number,
      },
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      postalCode: String,
    },
    paymentMethod: { type: String, enum: ["Stripe", "COD"], required: true },
    itemsPrice: Number,
    shippingPrice: Number,
    totalPrice: Number,
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    stripeSessionId: String,
    status: { type: String, enum: ["Processing", "Shipped", "Delivered", "Cancelled"], default: "Processing", index: true },
    statusHistory: [{ status: String, at: { type: Date, default: Date.now }, _id: false }],
    stockDeducted: { type: Boolean, default: false }, // true once inventory has been reserved for this order
    notes: { type: String, default: "" }, // system note shown to admins (e.g. paid but stock unavailable)
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
