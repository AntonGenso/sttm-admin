import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getOverview } from "../../api/stats";
import { StatTile } from "./StatTile";

/**
 * Admin home: academy-wide counters. Admins do not run classes themselves, so
 * the "create your first class" flow is a teacher-only view.
 *
 * Every tile opens the rows it counts. The missions tile reuses the existing
 * catalog page instead of a stats-only list — it is the same set of missions,
 * and a second read-only copy of it would drift.
 */
export const AdminDashboard = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["stats", "overview"],
    queryFn: getOverview,
  });

  const tiles = [
    {
      label: t("dashboard.teachers"),
      icon: "🧑‍🏫",
      value: data?.teachers,
      hint: t("dashboard.teachersHint"),
      to: "/teachers",
    },
    {
      label: t("dashboard.students"),
      icon: "🧑‍🚀",
      value: data?.students,
      hint: t("dashboard.studentsHint"),
      to: "/students",
    },
    {
      label: t("dashboard.missions"),
      icon: "🚀",
      value: data?.missions,
      hint: t("dashboard.missionsHint"),
      to: "/missions",
    },
    {
      label: t("dashboard.classes"),
      icon: "🛰️",
      value: data?.classes,
      hint: t("dashboard.classesHint"),
      to: "/classes",
    },
    {
      label: t("dashboard.schools"),
      icon: "🏫",
      value: data?.schools,
      // Непроверенные школы — это очередь, а не статистика: их видно только
      // здесь, и пока их не разобрали, в справочнике могут лежать дубли.
      hint: data?.unverified_schools
        ? t("dashboard.schoolsUnverifiedHint", { n: data.unverified_schools })
        : t("dashboard.schoolsHint"),
      to: "/schools",
    },
    {
      label: t("dashboard.cities"),
      icon: "🌍",
      value: data?.cities,
      hint: t("dashboard.citiesHint"),
      to: "/cities",
    },
    {
      label: t("dashboard.inClasses"),
      icon: "🎟️",
      value: data?.enrollments,
      hint: t("dashboard.inClassesHint"),
      to: "/enrollments",
    },
    {
      // Единственная плитка без числа: за ней не счётчик, а сводка по классам.
      // Считать её «итог пилота» одним числом нельзя — он складывается из
      // проведённых миссий и вовлечённости, а они живут в самой таблице.
      label: t("dashboard.pilot"),
      icon: "📈",
      hint: t("dashboard.pilotHint"),
      to: "/pilot-report",
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-3xl font-semibold text-white">
        {t("dashboard.glance")}
      </h2>

      {isError && (
        <p className="text-lg text-error">{t("dashboard.loadError")}</p>
      )}

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {tiles.map((tile) => (
          <li key={tile.label}>
            <StatTile {...tile} isLoading={isLoading} />
          </li>
        ))}
      </ul>
    </section>
  );
};
