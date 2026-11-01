import { createSlice } from "@reduxjs/toolkit";
import { load } from "../utils";

const MAX_PER_LINE = 10;

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: load("cart", []) },
  reducers: {
    addToCart(state, { payload: { product, qty } }) {
      const max = Math.min(product.countInStock, MAX_PER_LINE);
      const existing = state.items.find((i) => i.product === product._id);
      if (existing) {
        existing.qty = Math.min(existing.qty + qty, max);
        existing.countInStock = product.countInStock;
        existing.price = product.price;
      } else {
        state.items.push({
          product: product._id,
          name: product.name,
          image: product.image,
          price: product.price,
          countInStock: product.countInStock,
          qty: Math.min(qty, max),
        });
      }
    },
    setQty(state, { payload: { product, qty } }) {
      const item = state.items.find((i) => i.product === product);
      if (item) item.qty = Math.max(1, Math.min(qty, item.countInStock, MAX_PER_LINE));
    },
    removeFromCart(state, { payload }) {
      state.items = state.items.filter((i) => i.product !== payload);
    },
    clearCart(state) {
      state.items = [];
    },
    // Refresh price/stock from the server so the cart never shows stale data; drop deleted products.
    syncCart(state, { payload: products }) {
      const byId = new Map(products.map((p) => [p._id, p]));
      state.items = state.items
        .filter((i) => byId.has(i.product))
        .map((i) => {
          const p = byId.get(i.product);
          const qty = p.countInStock > 0 ? Math.max(1, Math.min(i.qty, p.countInStock, MAX_PER_LINE)) : i.qty;
          return { ...i, name: p.name, image: p.image, price: p.price, countInStock: p.countInStock, qty };
        });
    },
  },
});

export const { addToCart, setQty, removeFromCart, clearCart, syncCart } = cartSlice.actions;
export const selectCartCount = (s) => s.cart.items.reduce((n, i) => n + i.qty, 0);
export const selectCartTotal = (s) => s.cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
export default cartSlice.reducer;
