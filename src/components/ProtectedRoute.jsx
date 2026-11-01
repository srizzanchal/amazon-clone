import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

// Requires a signed-in user; remembers where they were going so login can send them back.
// (UI guard only - every API endpoint enforces auth on the server.)
export default function ProtectedRoute({ children }) {
  const user = useSelector((s) => s.user.user);
  const location = useLocation();
  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
}
