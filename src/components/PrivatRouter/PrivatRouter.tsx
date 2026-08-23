import { Outlet, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/authStore";

export default function PrivatRouter() {
  const { t } = useTranslation();
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <Suspense fallback={<div>{t("common.loading")}</div>}>
      <Outlet />
    </Suspense>
  );
}
