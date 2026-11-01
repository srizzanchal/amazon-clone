import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { errMsg, fmtDate, money } from "../utils";
import { useTitle } from "../hooks";
import Pagination from "../components/Pagination.jsx";
import { Spinner } from "../components/Skeleton.jsx";

export const paymentLabel = (o) =>
  o.status === "Cancelled" ? "Cancelled" : o.isPaid ? "Paid" : o.paymentMethod === "COD" ? "Pay on delivery" : "Payment pending";

export default function Orders() {
  useTitle("Your orders");
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setData(null);
    api.get(`/orders/mine?page=${page}`).then((r) => alive && setData(r.data)).catch((e) => alive && setError(errMsg(e)));
    return () => { alive = false; };
  }, [page]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <Spinner />;

  return (
    <div className="panel">
      <h1>Your Orders</h1>
      {!data.orders.length && <p>You haven't placed any orders yet. <Link to="/products">Start shopping</Link></p>}
      {data.orders.map((o) => (
        <div className="order-row" key={o._id}>
          <div className="order-thumbs">
            {o.items.slice(0, 3).map((i) => <img key={i._id} src={i.image} alt="" />)}
          </div>
          <div className="grow">
            <b>Order #{o._id.slice(-8).toUpperCase()}</b>
            <div className="muted">{fmtDate(o.createdAt)} · {o.items.length} item{o.items.length === 1 ? "" : "s"}</div>
            <div className="muted clamp">{o.items.map((i) => i.name).join(", ")}</div>
          </div>
          <div className="right">
            <div><b>{money(o.totalPrice)}</b></div>
            <span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span>
            <div className="muted small">{paymentLabel(o)}</div>
            <Link to={`/order/${o._id}`}>View details</Link>
          </div>
        </div>
      ))}
      <Pagination page={data.page} pages={data.pages} onChange={setPage} />
    </div>
  );
}
