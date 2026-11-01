import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { categoryIcon, errMsg } from "../utils";
import { useTitle } from "../hooks";
import ProductCard from "../components/ProductCard.jsx";
import { ProductSkeletons } from "../components/Skeleton.jsx";

const SLIDES = [
  { cls: "s1", title: "Everything you need, delivered", text: "Free delivery on orders above ₹499.", cta: "Shop all products", to: "/products" },
  { cls: "s2", title: "Gadgets & electronics", text: "Earbuds, power banks, keyboards and more.", cta: "Shop Electronics", to: "/products?category=Electronics" },
  { cls: "s3", title: "Read. Learn. Build.", text: "Books for developers and lifelong learners.", cta: "Browse Books", to: "/products?category=Books" },
];

function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [paused]);

  const s = SLIDES[i];
  return (
    <section className={`hero ${s.cls}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel">
      <div className="hero-body">
        <h1>{s.title}</h1>
        <p>{s.text}</p>
        <Link to={s.to} className="btn btn-yellow">{s.cta}</Link>
      </div>
      <button className="hero-nav prev" aria-label="Previous slide" onClick={() => setI((i + SLIDES.length - 1) % SLIDES.length)}>‹</button>
      <button className="hero-nav next" aria-label="Next slide" onClick={() => setI((i + 1) % SLIDES.length)}>›</button>
      <div className="hero-dots">
        {SLIDES.map((_, n) => (
          <button key={n} className={n === i ? "on" : ""} aria-label={`Go to slide ${n + 1}`} onClick={() => setI(n)} />
        ))}
      </div>
    </section>
  );
}

function Section({ title, to, products }) {
  if (!products.length) return null;
  return (
    <section className="home-section">
      <div className="section-head">
        <h2>{title}</h2>
        <Link to={to}>See all ›</Link>
      </div>
      <div className="grid">{products.map((p) => <ProductCard key={p._id} product={p} />)}</div>
    </section>
  );
}

export default function Home() {
  useTitle("");
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState({ rated: [], popular: [], newest: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get("/products/categories"),
      api.get("/products?sort=rating&rating=1&limit=4"),
      api.get("/products?sort=popular&limit=8"),
      api.get("/products?sort=newest&limit=4"),
    ])
      .then(([cats, rated, popular, newest]) => {
        if (!alive) return;
        setCategories(cats.data);
        setSections({
          rated: rated.data.products,
          popular: popular.data.products.filter((p) => p.sold > 0).slice(0, 4), // only genuinely sold products
          newest: newest.data.products,
        });
      })
      .catch((e) => alive && setError(errMsg(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return (
    <>
      <Hero />

      <div className="perks">
        <div><b>🚚 Free delivery</b><span>on orders above ₹499</span></div>
        <div><b>🔒 Secure checkout</b><span>Stripe test mode or Cash on Delivery</span></div>
        <div><b>↩️ Easy cancellation</b><span>cancel before it ships</span></div>
      </div>

      {error && <p className="error">{error}</p>}

      {categories.length > 0 && (
        <section className="home-section">
          <div className="section-head"><h2>Shop by category</h2></div>
          <div className="tiles">
            {categories.map((c) => (
              <Link key={c} to={`/products?category=${encodeURIComponent(c)}`} className="tile">
                <span className="tile-icon" aria-hidden="true">{categoryIcon(c)}</span>
                <span>{c}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <ProductSkeletons count={4} />
      ) : (
        <>
          <Section title="Best sellers" to="/products?sort=popular" products={sections.popular} />
          <Section title="Top rated" to="/products?sort=rating" products={sections.rated} />
          <Section title="New arrivals" to="/products?sort=newest" products={sections.newest} />
          {!error && !sections.newest.length && (
            <div className="panel empty">
              <h2>No products yet</h2>
              <p>Load the demo catalogue with <code>npm run seed</code> (see the README), or add products from the admin dashboard.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
