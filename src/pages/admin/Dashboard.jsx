import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { errMsg, fmtDate, money } from "../../utils";
import { Spinner } from "../../components/Skeleton.jsx";

const dayLabel = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <Spinner />;

  const max = Math.max(...stats.last7Days.map((d) => d.value), 1);

  return (
    <>
      <h1>Dashboard</h1>

      <div className="stat-grid">
        <div className="stat"><span>Revenue (paid)</span><b>{money(stats.revenue)}</b></div>
        <div className="stat"><span>Orders</span><b>{stats.orders}</b></div>
        <div className="stat"><span>Customers</span><b>{stats.users}</b></div>
        <div className="stat"><span>Products</span><b>{stats.products}</b></div>
      </div>

      <div className="admin-cols">
        <section className="panel">
          <h3>Order value, last 7 days</h3>
          <p className="muted small">Confirmed orders (paid, or cash on delivery), excluding cancelled.</p>
          <div className="bars" role="img" aria-label="Bar chart of order value for the last 7 days">
            {stats.last7Days.map((d) => (
              <div className="bar-col" key={d.date} title={`${d.date}: ${money(d.value)} from ${d.orders} order(s)`}>
                <span className="bar-val">{d.value ? money(d.value) : ""}</span>
                <div className="bar" style={{ height: `${(d.value / max) * 100}%` }} />
                <span className="bar-label">{dayLabel(d.date)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h3>Orders by status</h3>
          <ul className="status-list">
            {Object.entries(stats.ordersByStatus).map(([s, n]) => (
              <li key={s}><span className={`status status-${s.toLowerCase()}`}>{s}</span><b>{n}</b></li>
            ))}
          </ul>
          <Link to="/admin/orders">Manage orders ›</Link>
        </section>
      </div>

      <div className="admin-cols">
        <section className="panel">
          <h3>Low stock (≤ {stats.lowStockThreshold})</h3>
          {stats.lowStock.length === 0 ? (
            <p className="muted">All products are well stocked.</p>
          ) : (
            <ul className="status-list">
              {stats.lowStock.map((p) => (
                <li key={p._id}><span className="clamp">{p.name}</span><b className={p.countInStock === 0 ? "out" : "low"}>{p.countInStock === 0 ? "Out of stock" : `${p.countInStock} left`}</b></li>
              ))}
            </ul>
          )}
          <Link to="/admin/products">Manage inventory ›</Link>
        </section>

        <section className="panel">
          <h3>Recent orders</h3>
          {stats.recentOrders.length === 0 ? (
            <p className="muted">No orders yet.</p>
          ) : (
            <ul className="status-list">
              {stats.recentOrders.map((o) => (
                <li key={o._id}>
                  <span>#{o._id.slice(-6).toUpperCase()} · {o.user?.name || "Deleted user"}<br /><small className="muted">{fmtDate(o.createdAt)}</small></span>
                  <b>{money(o.totalPrice)}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
