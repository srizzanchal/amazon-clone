import { Link } from "react-router-dom";
import { useTitle } from "../hooks";

export default function NotFound() {
  useTitle("Page not found");
  return (
    <div className="panel empty">
      <h1>404 – Page not found</h1>
      <p>The page you are looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn btn-yellow">Go to the homepage</Link>
    </div>
  );
}
