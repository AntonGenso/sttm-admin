import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";
import { TeacherClasses } from "../components/Classes/TeacherClasses";
import { AdminDashboard } from "../components/Dashboard/AdminDashboard";

export default function HomePage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  // Admins run the academy, not a class of their own — they get the numbers,
  // teachers get their classes.
  const isAdmin = useAuthStore((state) => state.hasRole("admin"));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-5xl font-bold tracking-wide text-white">
          {t("home.welcome")}
          {user ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-2 text-xl text-grey">
          {isAdmin ? t("home.overviewAdmin") : t("home.overviewTeacher")}
        </p>
      </div>

      {isAdmin ? <AdminDashboard /> : <TeacherClasses />}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Link
          to="/missions"
          className="group rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] p-6 backdrop-blur-md transition-colors hover:border-cyan-bright/60"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-bright">
            {isAdmin ? t("home.manage") : t("home.explore")}
          </span>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            {t("home.missionsTitle")}
          </h2>
          <p className="mt-1 text-lg text-grey">
            {isAdmin
              ? t("home.missionsDescAdmin")
              : t("home.missionsDescTeacher")}
          </p>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-[rgba(5,20,30,0.5)] p-6 backdrop-blur-md">
          <span className="font-mono text-xs uppercase tracking-widest text-orange-bright">
            {t("home.comingSoon")}
          </span>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            {t("home.usersTitle")}
          </h2>
          <p className="mt-1 text-lg text-grey">{t("home.usersDesc")}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[rgba(5,20,30,0.5)] p-6 backdrop-blur-md">
          <span className="font-mono text-xs uppercase tracking-widest text-orange-bright">
            {t("home.comingSoon")}
          </span>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            {t("home.analyticsTitle")}
          </h2>
          <p className="mt-1 text-lg text-grey">{t("home.analyticsDesc")}</p>
        </div>
      </div>
    </div>
  );
}
