import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../api";
import { addToCart } from "../store/cartSlice";
import { errMsg, fmtDate, money } from "../utils";
import { useTitle, useWishlist } from "../hooks";
import { toast } from "../toast";
import Rating, { StarInput } from "../components/Rating.jsx";
import { Spinner } from "../components/Skeleton.jsx";

function Reviews({ productId, onChanged }) {
  const user = useSelector((s) => s.user.user);
  const [reviews, setReviews] = useState(null);
  const [form, setForm] = useState({ rating: 0, comment: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setReviews((await api.get(`/products/${productId}/reviews`)).data);
    } catch (e) {
      toast.error(errMsg(e));
      setReviews([]);
    }
  }, [productId]);

  useEffect(() => { load(); }, [load]);

  const mine = reviews?.find((r) => r.user === user?._id);
  useEffect(() => {
    if (mine) setForm({ rating: mine.rating, comment: mine.comment });
  }, [mine?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    if (!form.rating) return toast.error("Choose a star rating first");
    setBusy(true);
    try {
      await api.post(`/products/${productId}/reviews`, form);
      toast.success(mine ? "Review updated" : "Thanks for your review!");
      await load();
      onChanged();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete your review?")) return;
    try {
      await api.delete(`/products/${productId}/reviews`);
      setForm({ rating: 0, comment: "" });
      toast.success("Review deleted");
      await load();
      onChanged();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <section className="reviews panel">
      <h2>Customer reviews</h2>

      {user ? (
        <form className="review-form" onSubmit={submit}>
          <h3>{mine ? "Edit your review" : "Write a review"}</h3>
          <StarInput value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
          <textarea
            rows="3"
            maxLength={1000}
            placeholder="What did you like or dislike? (optional)"
            aria-label="Review comment"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
          <div className="row">
            <button className="btn btn-yellow" disabled={busy}>{busy ? "Saving…" : mine ? "Update review" : "Submit review"}</button>
            {mine && <button type="button" className="btn" onClick={remove}>Delete</button>}
          </div>
        </form>
      ) : (
        <p><Link to="/login" state={{ from: { pathname: `/product/${productId}` } }}>Sign in</Link> to write a review.</p>
      )}

      {!reviews ? (
        <Spinner />
      ) : reviews.length === 0 ? (
        <p className="muted">No reviews yet. Be the first to review this product.</p>
      ) : (
        reviews.map((r) => (
          <article className="review" key={r._id}>
            <div className="review-head">
              <b>{r.name}</b>
              <Rating value={r.rating} />
              {r.verified && <span className="tag">Verified purchase</span>}
              <span className="muted">{fmtDate(r.createdAt)}</span>
            </div>
            {r.comment && <p>{r.comment}</p>}
          </article>
        ))
      )}
    </section>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { ids, toggle } = useWishlist();
  useTitle(product?.name);

  const loadProduct = useCallback(
    () => api.get(`/products/${id}`).then((r) => setProduct(r.data)).catch((e) => setError(errMsg(e))),
    [id]
  );

  useEffect(() => {
    setProduct(null);
    setError("");
    setQty(1);
    loadProduct();
  }, [loadProduct]);

  if (error) return <div className="panel empty"><p className="error">{error}</p><Link to="/products" className="btn">Back to products</Link></div>;
  if (!product) return <Spinner />;

  const inStock = product.countInStock > 0;
  const saved = ids.has(product._id);
  const add = () => {
    dispatch(addToCart({ product, qty }));
    toast.success(`Added ${qty} × “${product.name}” to your cart`);
  };
  const buyNow = () => {
    dispatch(addToCart({ product, qty }));
    navigate("/checkout");
  };

  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/products">Products</Link> › <Link to={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
      </nav>

      <div className="detail">
        <div className="detail-img"><img src={product.image} alt={product.name} /></div>
        <div className="detail-info">
          <h1>{product.name}</h1>
          {product.brand && <p className="muted">Brand: {product.brand}</p>}
          <Rating value={product.rating} count={product.numReviews} />
          <hr />
          <div className="price big">{money(product.price)}</div>
          <p className="muted small">Inclusive of all taxes. Free delivery on orders above ₹499.</p>
          <p className="desc">{product.description}</p>
        </div>
        <aside className="buybox">
          <div className="price big">{money(product.price)}</div>
          <p className={inStock ? "in-stock" : "out"}>
            {inStock ? (product.countInStock <= 5 ? `Only ${product.countInStock} left in stock` : "In stock") : "Currently unavailable"}
          </p>
          {inStock && (
            <>
              <label>
                Quantity{" "}
                <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                  {Array.from({ length: Math.min(product.countInStock, 10) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <button className="btn btn-yellow block" onClick={add}>Add to Cart</button>
              <button className="btn btn-orange block" onClick={buyNow}>Buy Now</button>
            </>
          )}
          <button className="btn block" onClick={() => toggle(product)} aria-pressed={saved}>
            {saved ? "♥ Saved to wishlist" : "♡ Add to wishlist"}
          </button>
        </aside>
      </div>

      <Reviews productId={product._id} onChanged={loadProduct} />
    </>
  );
}
