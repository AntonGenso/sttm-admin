import { Outlet, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { useAuthStore } from "../../store/authStore";

export default function PrivatRouter() {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {" "}
      <Outlet />{" "}
    </Suspense>
  );
}
