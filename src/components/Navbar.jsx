import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../store/userSlice";
import { selectCartCount } from "../store/cartSlice";
import { toast } from "../toast";
import api from "../api";

export default function Navbar() {
  const [params] = useSearchParams();
  const location = useLocation();
  const [q, setQ] = useState(params.get("keyword") || "");
  const [cat, setCat] = useState(params.get("category") || "");
  const [categories, setCategories] = useState([]);
  const user = useSelector((s) => s.user.user);
  const count = useSelector(selectCartCount);
  const wishCount = useSelector((s) => s.wishlist.items.length);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/products/categories").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  // keep the search box in sync when the URL changes (e.g. clicking a category tile)
  useEffect(() => {
    if (location.pathname === "/products") {
      setQ(params.get("keyword") || "");
      setCat(params.get("category") || "");
    }
  }, [location.pathname, params]);

  const search = (e) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (q.trim()) next.set("keyword", q.trim());
    if (cat) next.set("category", cat);
    navigate(`/products${next.toString() ? `?${next}` : ""}`);
  };

  const signOut = async () => {
    await dispatch(logoutUser());
    toast.info("You have been signed out");
    navigate("/");
  };

  return (
    <header className="site-header">
      <div className="navbar">
        <Link to="/" className="logo">amazon<span>.clone</span></Link>

        <form className="search" onSubmit={search} role="search">
          <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Search category">
            <option value="">All</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, brands and categories" aria-label="Search" />
          <button type="submit" aria-label="Search">🔍</button>
        </form>

        <nav className="nav-links">
          {user ? (
            <div className="menu">
              <button className="menu-trigger" aria-haspopup="true">
                <small>Hello, {user.name.split(" ")[0]}</small>
                <b>Account ▾</b>
              </button>
              <div className="menu-panel">
                <Link to="/account">Your account</Link>
                <Link to="/orders">Your orders</Link>
                <Link to="/wishlist">Your wishlist</Link>
                {user.role === "admin" && <Link to="/admin">Admin dashboard</Link>}
                <button className="linklike" onClick={signOut}>Sign out</button>
              </div>
            </div>
          ) : (
            <Link to="/login" state={{ from: location }}><small>Hello, sign in</small><b>Account</b></Link>
          )}
          <Link to="/orders" className="hide-sm"><small>Returns</small><b>&amp; Orders</b></Link>
          <Link to="/wishlist" className="wish-link" aria-label="Wishlist">♡{wishCount > 0 && <span className="badge small">{wishCount}</span>}</Link>
          <Link to="/cart" className="cart-link" aria-label={`Cart, ${count} items`}>🛒 <b className="hide-sm">Cart</b><span className="badge">{count}</span></Link>
        </nav>
      </div>

      <div className="subnav" aria-label="Categories">
        <Link to="/products" className={location.pathname === "/products" && !params.get("category") && !params.get("sort") ? "active" : ""}>All</Link>
        {categories.map((c) => (
          <Link key={c} to={`/products?category=${encodeURIComponent(c)}`} className={params.get("category") === c && location.pathname === "/products" ? "active" : ""}>{c}</Link>
        ))}
        <Link to="/products?sort=popular">Best Sellers</Link>
        <Link to="/products?sort=newest">New Arrivals</Link>
        {user?.role === "admin" && <Link to="/admin" className="admin-link">Admin</Link>}
      </div>
    </header>
  );
}
