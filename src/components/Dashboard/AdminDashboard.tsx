import { useQuery } from "@tanstack/react-query";
import { getOverview } from "../../api/stats";
import { StatTile } from "./StatTile";

/**
 * Admin home: academy-wide counters. Admins do not run classes themselves, so
 * the "create your first class" flow is a teacher-only view.
 */
export const AdminDashboard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["stats", "overview"],
    queryFn: getOverview,
  });

  const tiles = [
    {
      label: "Teachers",
      icon: "🧑‍🏫",
      value: data?.teachers,
      hint: "Accounts with the teacher role",
    },
    {
      label: "Students",
      icon: "🧑‍🚀",
      value: data?.students,
      hint: "Accounts with the student role",
    },
    {
      label: "Missions",
      icon: "🚀",
      value: data?.missions,
      hint: "Published across the academy",
    },
    {
      label: "Classes",
      icon: "🛰️",
      value: data?.classes,
      hint: "Created by teachers",
    },
    {
      label: "Schools",
      icon: "🏫",
      value: data?.schools,
      hint: "Registered while creating classes",
    },
    {
      label: "In classes",
      icon: "🎟️",
      value: data?.enrollments,
      hint: "Students who joined by code",
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-3xl font-semibold text-white">Academy at a glance</h2>

      {isError && (
        <p className="text-lg text-error">Could not load the statistics</p>
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
