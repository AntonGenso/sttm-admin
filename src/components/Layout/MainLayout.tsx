import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/authStore";
import { logoutUser } from "../../api/auth";
import { LanguageSwitcher } from "../../uikit/LanguageSwitcher";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full px-4 py-1.5 text-lg font-medium tracking-wide transition-colors",
    isActive
      ? "bg-cyan-bright/15 text-cyan-bright"
      : "text-grey hover:text-white",
  ].join(" ");

export const MainLayout = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    // Best-effort: revoke the refresh token server-side before clearing local
    // state. We don't await it — logout should feel instant either way.
    const { refreshToken } = useAuthStore.getState();
    if (refreshToken) {
      void logoutUser(refreshToken).catch(() => {});
    }
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-20 border-b border-cyan-bright/20 bg-[rgba(7,21,42,0.75)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-bold tracking-widest text-cyan-bright">
              STTM<span className="text-white"> · ADMIN</span>
            </span>
            <nav className="flex items-center gap-2">
              <NavLink to="/" end className={navLinkClass}>
                {t("nav.home")}
              </NavLink>
              <NavLink to="/missions" className={navLinkClass}>
                {t("nav.missions")}
              </NavLink>
              <NavLink to="/tests" className={navLinkClass}>
                {t("nav.tests")}
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {user && <span className="text-lg text-grey">{user.name}</span>}
            <button
              onClick={handleLogout}
              className="rounded-full border border-cyan-bright/40 px-4 py-1.5 text-base text-cyan-bright transition-colors hover:bg-cyan-bright/10"
            >
              {t("auth.logout")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};
