import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <button className="back-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top</button>
      <div className="footer-cols">
        <div>
          <h4>Shop</h4>
          <Link to="/products">All products</Link>
          <Link to="/products?sort=popular">Best sellers</Link>
          <Link to="/products?sort=newest">New arrivals</Link>
        </div>
        <div>
          <h4>Your account</h4>
          <Link to="/account">Account &amp; addresses</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/wishlist">Wishlist</Link>
        </div>
        <div>
          <h4>About</h4>
          <p>A portfolio project built with React, Redux Toolkit, Node.js, Express, MongoDB and Stripe (test mode). Not affiliated with Amazon.</p>
        </div>
      </div>
    </footer>
  );
}
