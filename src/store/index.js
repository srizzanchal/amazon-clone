import { configureStore } from "@reduxjs/toolkit";
import cart from "./cartSlice";
import user from "./userSlice";
import wishlist from "./wishlistSlice";

export const store = configureStore({ reducer: { cart, user, wishlist } });

// Persist the cart and the (non-sensitive) user profile so a refresh keeps the UI state.
// The auth token itself is an httpOnly cookie and is never readable from JavaScript.
store.subscribe(() => {
  const { cart, user } = store.getState();
  try {
    localStorage.setItem("cart", JSON.stringify(cart.items));
    if (user.user) localStorage.setItem("userInfo", JSON.stringify(user.user));
    else localStorage.removeItem("userInfo");
  } catch {
    /* storage unavailable - app still works for the session */
  }
});
