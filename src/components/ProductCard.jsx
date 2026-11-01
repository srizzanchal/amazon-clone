import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/cartSlice";
import { useWishlist } from "../hooks";
import { toast } from "../toast";
import { money } from "../utils";
import Rating from "./Rating.jsx";

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const { ids, toggle } = useWishlist();
  const saved = ids.has(product._id);
  const out = product.countInStock < 1;
  const to = `/product/${product._id}`;

  const add = () => {
    dispatch(addToCart({ product, qty: 1 }));
    toast.success(`Added “${product.name}” to your cart`);
  };

  return (
    <article className="card">
      <button
        className={`heart ${saved ? "on" : ""}`}
        onClick={() => toggle(product)}
        aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={saved}
      >
        {saved ? "♥" : "♡"}
      </button>
      <Link to={to} className="card-img"><img src={product.image} alt={product.name} loading="lazy" /></Link>
      <Link to={to} className="card-title">{product.name}</Link>
      <Rating value={product.rating} count={product.numReviews} />
      <div className="price">{money(product.price)}</div>
      {out ? (
        <span className="out">Currently unavailable</span>
      ) : (
        <>
          {product.countInStock <= 5 && <span className="low">Only {product.countInStock} left</span>}
          <button className="btn btn-yellow" onClick={add}>Add to Cart</button>
        </>
      )}
    </article>
  );
}
