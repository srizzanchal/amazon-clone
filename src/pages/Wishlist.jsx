import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTitle } from "../hooks";
import ProductCard from "../components/ProductCard.jsx";
import { Spinner } from "../components/Skeleton.jsx";

export default function Wishlist() {
  useTitle("Your wishlist");
  const { items, loaded } = useSelector((s) => s.wishlist);

  if (!loaded) return <Spinner />;
  if (!items.length) {
    return (
      <div className="panel empty">
        <h1>Your wishlist is empty</h1>
        <p>Tap the heart on any product to save it for later.</p>
        <Link to="/products" className="btn btn-yellow">Browse products</Link>
      </div>
    );
  }
  return (
    <>
      <h1>Your wishlist <span className="muted">({items.length})</span></h1>
      <div className="grid">{items.map((p) => <ProductCard key={p._id} product={p} />)}</div>
    </>
  );
}
