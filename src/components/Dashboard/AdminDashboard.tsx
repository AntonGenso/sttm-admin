import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getOverview } from "../../api/stats";
import { StatTile } from "./StatTile";

/**
 * Admin home: academy-wide counters. Admins do not run classes themselves, so
 * the "create your first class" flow is a teacher-only view.
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
    },
    {
      label: t("dashboard.students"),
      icon: "🧑‍🚀",
      value: data?.students,
      hint: t("dashboard.studentsHint"),
    },
    {
      label: t("dashboard.missions"),
      icon: "🚀",
      value: data?.missions,
      hint: t("dashboard.missionsHint"),
    },
    {
      label: t("dashboard.classes"),
      icon: "🛰️",
      value: data?.classes,
      hint: t("dashboard.classesHint"),
    },
    {
      label: t("dashboard.schools"),
      icon: "🏫",
      value: data?.schools,
      hint: t("dashboard.schoolsHint"),
    },
    {
      label: t("dashboard.inClasses"),
      icon: "🎟️",
      value: data?.enrollments,
      hint: t("dashboard.inClassesHint"),
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
