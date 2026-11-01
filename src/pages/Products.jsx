import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import { errMsg } from "../utils";
import { useTitle } from "../hooks";
import ProductCard from "../components/ProductCard.jsx";
import Pagination from "../components/Pagination.jsx";
import { ProductSkeletons } from "../components/Skeleton.jsx";

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ products: [], page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [price, setPrice] = useState({ min: params.get("minPrice") || "", max: params.get("maxPrice") || "" });
  const query = params.toString();

  const category = params.get("category") || "";
  const rating = params.get("rating") || "";
  const keyword = params.get("keyword");
  useTitle(keyword ? `Results for “${keyword}”` : category || "All products");

  useEffect(() => {
    api.get("/products/categories").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    api
      .get(`/products?${query}`)
      .then((r) => alive && setData(r.data))
      .catch((e) => alive && setError(errMsg(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [query]);

  // keep the price inputs in sync with the URL (e.g. after "Clear all filters")
  useEffect(() => {
    setPrice({ min: params.get("minPrice") || "", max: params.get("maxPrice") || "" });
  }, [params]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  };
  const applyPrice = (e) => {
    e.preventDefault();
    update({ minPrice: price.min, maxPrice: price.max });
  };

  const filterCount = ["category", "rating", "minPrice", "maxPrice", "inStock", "keyword"].filter((k) => params.get(k)).length;

  return (
    <div className="layout">
      <aside className={`filters ${showFilters ? "open" : ""}`}>
        <h3>Category</h3>
        <ul>
          <li><button className={`linklike ${!category ? "active" : ""}`} onClick={() => update({ category: "" })}>All</button></li>
          {categories.map((c) => (
            <li key={c}><button className={`linklike ${category === c ? "active" : ""}`} onClick={() => update({ category: c })}>{c}</button></li>
          ))}
        </ul>

        <h3>Customer rating</h3>
        <ul>
          {[4, 3, 2, 1].map((r) => (
            <li key={r}>
              <button className={`linklike ${rating === String(r) ? "active" : ""}`} onClick={() => update({ rating: rating === String(r) ? "" : r })}>
                <span className="stars">{"★".repeat(r)}{"☆".repeat(5 - r)}</span> &amp; up
              </button>
            </li>
          ))}
        </ul>

        <h3>Price (₹)</h3>
        <form className="price-form" onSubmit={applyPrice}>
          <input type="number" min="0" placeholder="Min" aria-label="Minimum price" value={price.min} onChange={(e) => setPrice({ ...price, min: e.target.value })} />
          <input type="number" min="0" placeholder="Max" aria-label="Maximum price" value={price.max} onChange={(e) => setPrice({ ...price, max: e.target.value })} />
          <button className="btn" type="submit">Go</button>
        </form>

        <h3>Availability</h3>
        <label className="check">
          <input type="checkbox" checked={params.get("inStock") === "1"} onChange={(e) => update({ inStock: e.target.checked ? "1" : "" })} /> In stock only
        </label>

        {filterCount > 0 && <button className="linklike clear" onClick={() => setParams({})}>Clear all filters</button>}
      </aside>

      <section>
        <div className="toolbar">
          <span>
            {loading ? "Loading…" : `${data.total} result${data.total === 1 ? "" : "s"}`}
            {keyword && <> for <b>“{keyword}”</b></>}
            {category && <> in <b>{category}</b></>}
          </span>
          <div className="toolbar-right">
            <button className="btn filter-toggle" onClick={() => setShowFilters((v) => !v)}>
              Filters{filterCount > 0 ? ` (${filterCount})` : ""}
            </button>
            <label>
              Sort by{" "}
              <select value={params.get("sort") || "newest"} onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })}>
                <option value="newest">Newest</option>
                <option value="popular">Popularity</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Avg. customer rating</option>
              </select>
            </label>
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        {loading && <ProductSkeletons />}
        {!loading && !error && data.products.length === 0 && (
          <div className="panel empty"><h2>No products found</h2><p>Try a different search or remove some filters.</p></div>
        )}
        {!loading && <div className="grid">{data.products.map((p) => <ProductCard key={p._id} product={p} />)}</div>}

        <Pagination page={data.page} pages={data.pages} onChange={(n) => update({ page: n === 1 ? "" : n })} />
      </section>
    </div>
  );
}
