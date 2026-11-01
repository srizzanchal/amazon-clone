import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../api";
import { removeFromCart, setQty, syncCart, selectCartCount, selectCartTotal } from "../store/cartSlice";
import { FREE_SHIPPING_ABOVE, money } from "../utils";
import { useTitle } from "../hooks";

export default function Cart() {
  useTitle("Shopping cart");
  const items = useSelector((s) => s.cart.items);
  const count = useSelector(selectCartCount);
  const total = useSelector(selectCartTotal);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const idsKey = items.map((i) => i.product).join(",");

  // Refresh prices/stock from the server (cart data in localStorage can be stale)
  useEffect(() => {
    if (!idsKey) return;
    api.get(`/products/by-ids?ids=${idsKey}`).then((r) => dispatch(syncCart(r.data))).catch(() => {});
  }, [idsKey, dispatch]);

  if (!items.length) {
    return (
      <div className="panel empty">
        <h1>Your cart is empty</h1>
        <p>Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn btn-yellow">Continue shopping</Link>
      </div>
    );
  }

  const unavailable = items.filter((i) => i.countInStock < 1);

  return (
    <div className="cart-layout">
      <section className="panel">
        <h1>Shopping Cart</h1>
        {items.map((i) => (
          <div className="cart-row" key={i.product}>
            <img src={i.image} alt={i.name} />
            <div className="grow">
              <Link to={`/product/${i.product}`} className="card-title">{i.name}</Link>
              {i.countInStock < 1 ? (
                <p className="out">Currently unavailable – remove it to continue</p>
              ) : (
                <p className="in-stock small">{i.countInStock <= 5 ? `Only ${i.countInStock} left` : "In stock"}</p>
              )}
              <div className="actions">
                {i.countInStock > 0 && (
                  <select aria-label={`Quantity for ${i.name}`} value={i.qty} onChange={(e) => dispatch(setQty({ product: i.product, qty: Number(e.target.value) }))}>
                    {Array.from({ length: Math.min(i.countInStock, 10) }, (_, k) => k + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                )}
                <button className="linklike" onClick={() => dispatch(removeFromCart(i.product))}>Delete</button>
              </div>
            </div>
            <div className="price">{money(i.price * i.qty)}</div>
          </div>
        ))}
        <div className="subtotal">Subtotal ({count} item{count === 1 ? "" : "s"}): <b>{money(total)}</b></div>
      </section>

      <aside className="panel summary">
        <div className="subtotal">Subtotal ({count} item{count === 1 ? "" : "s"}): <b>{money(total)}</b></div>
        <p className="muted">{total >= FREE_SHIPPING_ABOVE ? "✓ Your order qualifies for FREE delivery." : `Add ${money(FREE_SHIPPING_ABOVE - total)} more for FREE delivery.`}</p>
        {unavailable.length > 0 && <p className="error">Remove unavailable items to check out.</p>}
        <button className="btn btn-yellow block" disabled={unavailable.length > 0} onClick={() => navigate("/checkout")}>Proceed to Buy</button>
      </aside>
    </div>
  );
}
