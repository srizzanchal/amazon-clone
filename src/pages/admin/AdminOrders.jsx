import { useCallback, useEffect, useState } from "react";
import api from "../../api";
import { NEXT_STATUS, ORDER_STATUSES, errMsg, fmtDate, money } from "../../utils";
import { toast } from "../../toast";
import Pagination from "../../components/Pagination.jsx";
import { Spinner } from "../../components/Skeleton.jsx";

export default function AdminOrders() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page });
    if (status) qs.set("status", status);
    return api.get(`/admin/orders?${qs}`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (order, next) => {
    if (!next) return;
    if (next === "Cancelled" && !window.confirm("Cancel this order? Stock will be restored.")) return;
    setBusyId(order._id);
    try {
      const { data: updated } = await api.put(`/admin/orders/${order._id}/status`, { status: next });
      setData((d) => ({ ...d, orders: d.orders.map((o) => (o._id === updated._id ? updated : o)) }));
      toast.success(`Order marked ${next}`);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="section-head">
        <h1>Orders</h1>
        <label>
          Status{" "}
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All</option>
            {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="error">{error}</p>}
      {!data ? (
        <Spinner />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Update</th></tr></thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o._id}>
                  <td>
                    <details>
                      <summary>#{o._id.slice(-8).toUpperCase()}<br /><small className="muted">{fmtDate(o.createdAt)}</small></summary>
                      <ul className="order-items">
                        {o.items.map((i) => <li key={i._id}>{i.qty} × {i.name} ({money(i.price)})</li>)}
                      </ul>
                      <p className="small">{o.shippingAddress.fullName}, {o.shippingAddress.address}, {o.shippingAddress.city} – {o.shippingAddress.postalCode}<br />Phone: {o.shippingAddress.phone}</p>
                      {o.notes && <p className="error small">{o.notes}</p>}
                    </details>
                  </td>
                  <td>{o.user?.name || "Deleted user"}<br /><small className="muted">{o.user?.email}</small></td>
                  <td>{money(o.totalPrice)}</td>
                  <td>{o.paymentMethod === "COD" ? "COD" : "Card"} · {o.isPaid ? "Paid" : "Unpaid"}</td>
                  <td><span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span></td>
                  <td>
                    {NEXT_STATUS[o.status].length === 0 ? (
                      <span className="muted">—</span>
                    ) : (
                      <select aria-label={`Update status of order ${o._id.slice(-8)}`} disabled={busyId === o._id} value="" onChange={(e) => changeStatus(o, e.target.value)}>
                        <option value="">Change…</option>
                        {NEXT_STATUS[o.status].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
              {data.orders.length === 0 && <tr><td colSpan="6" className="muted">No orders found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}
    </>
  );
}
