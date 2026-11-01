import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    image: { type: String, required: true },
    brand: { type: String, default: "", trim: true },
    category: { type: String, required: true, index: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    countInStock: { type: Number, required: true, min: 0, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 }, // average of real Review documents
    numReviews: { type: Number, default: 0 },
    sold: { type: Number, default: 0, min: 0 }, // units sold; drives the "popularity" sort
  },
  { timestamps: true }
);

productSchema.index({ price: 1 });
productSchema.index({ sold: -1 });

export default mongoose.model("Product", productSchema);
