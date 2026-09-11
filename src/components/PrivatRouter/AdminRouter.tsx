import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

/**
 * Guards the academy-wide lists. The endpoints behind them answer 403 to a
 * teacher, so without this a teacher who typed the URL would land on an error
 * screen instead of their own home page.
 */
export default function AdminRouter() {
  const isAdmin = useAuthStore((state) => state.hasRole("admin"));

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
