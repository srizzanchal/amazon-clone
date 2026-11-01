import { NavLink, Outlet } from "react-router-dom";
import { useTitle } from "../../hooks";

const LINKS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/orders", label: "Orders" },
];

export default function AdminLayout() {
  useTitle("Admin");
  return (
    <div className="admin">
      <nav className="admin-nav" aria-label="Admin">
        <h2>Admin</h2>
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "active" : "")}>{l.label}</NavLink>
        ))}
      </nav>
      <div className="admin-body"><Outlet /></div>
    </div>
  );
}
