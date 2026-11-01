import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toggleWishlist } from "./store/wishlistSlice";
import { toast } from "./toast";

// Wishlist helper for components: `ids` is a memoised Set, `toggle(product)` handles sign-in + toasts.
export function useWishlist() {
  const items = useSelector((s) => s.wishlist.items);
  const user = useSelector((s) => s.user.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const ids = useMemo(() => new Set(items.map((p) => p._id)), [items]);

  const toggle = async (product) => {
    if (!user) {
      toast.info("Sign in to save items to your wishlist");
      navigate("/login", { state: { from: location } });
      return;
    }
    const res = await dispatch(toggleWishlist(product._id));
    if (toggleWishlist.fulfilled.match(res)) toast.success(res.payload.added ? "Added to your wishlist" : "Removed from your wishlist");
    else toast.error(res.payload || "Could not update wishlist");
  };

  return { ids, toggle };
}

// Sets the browser tab title for a page
export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Amazon Clone` : "Amazon Clone";
  }, [title]);
}
