import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

// Admin-only pages. The role shown here is a UI hint; the API re-checks the role on every admin request.
export default function AdminRoute({ children }) {
  const user = useSelector((s) => s.user.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.role !== "admin") {
    return (
      <div className="panel">
        <h1>Access denied</h1>
        <p>You need an administrator account to view this page.</p>
      </div>
    );
  }
  return children;
}
