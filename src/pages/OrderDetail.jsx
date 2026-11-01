import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import api from "../api";
import { clearCart } from "../store/cartSlice";
import { errMsg, fmtDate, money } from "../utils";
import { useTitle } from "../hooks";
import { toast } from "../toast";
import { Spinner } from "../components/Skeleton.jsx";

const STEPS = ["Processing", "Shipped", "Delivered"];

// Order tracking: one step per status, with the time each step was reached
function Tracker({ order }) {
  if (order.status === "Cancelled") {
    const when = order.statusHistory?.find((h) => h.status === "Cancelled")?.at;
    return <p className="error">This order was cancelled{when ? ` on ${fmtDate(when, true)}` : ""}.</p>;
  }
  const current = STEPS.indexOf(order.status);
  return (
    <ol className="tracker" aria-label="Order progress">
      {STEPS.map((s, i) => {
        const at = order.statusHistory?.find((h) => h.status === s)?.at;
        return (
          <li key={s} className={i <= current ? "done" : ""} aria-current={i === current ? "step" : undefined}>
            <span className="dot">{i <= current ? "✓" : i + 1}</span>
            <b>{s === "Processing" ? "Order placed" : s}</b>
            <small className="muted">{at ? fmtDate(at, true) : "—"}</small>
          </li>
        );
      })}
    </ol>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const cancelled = params.get("cancelled");
  const justPlaced = params.get("placed");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dispatch = useDispatch();
  useTitle(order ? `Order #${order._id.slice(-8).toUpperCase()}` : "Order");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let res;
        if (sessionId) {
          res = await api.post(`/orders/${id}/verify-payment`, { sessionId }); // server confirms with Stripe
          dispatch(clearCart());
        } else {
          res = await api.get(`/orders/${id}`);
        }
        if (alive) setOrder(res.data);
      } catch (e) {
        if (alive) setError(errMsg(e));
      }
    })();
    return () => { alive = false; };
  }, [id, sessionId, dispatch]);

  const payNow = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/orders/${id}/pay`);
      window.location.assign(data.checkoutUrl);
    } catch (e) {
      toast.error(errMsg(e));
      setBusy(false);
    }
  };

  const cancelOrder = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setBusy(true);
    try {
      setOrder((await api.put(`/orders/${id}/cancel`)).data);
      toast.success("Order cancelled");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="panel"><p className="error">{error}</p><Link to="/orders">My orders</Link></div>;
  if (!order) return <Spinner label={sessionId ? "Confirming your payment…" : "Loading…"} />;

  const needsPayment = order.paymentMethod === "Stripe" && !order.isPaid && order.status !== "Cancelled";
  const a = order.shippingAddress;

  return (
    <div className="panel">
      {order.status === "Cancelled" ? null : order.isPaid || order.paymentMethod === "COD" ? (
        (justPlaced || sessionId) && <p className="success banner">✓ Order placed, thank you! A confirmation is shown below.</p>
      ) : (
        <p className="error banner">{cancelled ? "Payment was cancelled." : "Payment is pending."} Your order is not confirmed until it is paid.</p>
      )}

      <h1>Order #{order._id.slice(-8).toUpperCase()}</h1>
      <p className="muted">Placed on {fmtDate(order.createdAt, true)} · Status: <span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span></p>

      <Tracker order={order} />

      <div className="two-col">
        <div>
          <h3>Delivery address</h3>
          <p>{a.fullName}<br />{a.address}<br />{a.city} – {a.postalCode}<br />Phone: {a.phone}</p>
        </div>
        <div>
          <h3>Payment</h3>
          <p>
            {order.paymentMethod === "COD" ? "Cash on Delivery" : "Card (Stripe)"}<br />
            {order.isPaid ? `Paid on ${fmtDate(order.paidAt)}` : order.paymentMethod === "COD" ? "Pay when delivered" : "Not paid"}
          </p>
          <div className="row">
            {needsPayment && <button className="btn btn-yellow" onClick={payNow} disabled={busy}>{busy ? "Please wait…" : "Pay now"}</button>}
            {order.status === "Processing" && <button className="btn" onClick={cancelOrder} disabled={busy}>Cancel order</button>}
          </div>
        </div>
      </div>

      <h3>Items</h3>
      {order.items.map((i) => (
        <div className="cart-row compact" key={i._id}>
          <img src={i.image} alt={i.name} />
          <div className="grow"><Link to={`/product/${i.product}`}>{i.name}</Link><div className="muted">Qty: {i.qty} × {money(i.price)}</div></div>
          <div>{money(i.price * i.qty)}</div>
        </div>
      ))}
      <div className="sum"><span>Items</span><span>{money(order.itemsPrice)}</span></div>
      <div className="sum"><span>Delivery</span><span>{order.shippingPrice ? money(order.shippingPrice) : "FREE"}</span></div>
      <div className="sum total"><span>Total</span><span>{money(order.totalPrice)}</span></div>
      <p><Link to="/orders">View all orders</Link> · <Link to="/products">Continue shopping</Link></p>
    </div>
  );
}
