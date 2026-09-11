import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getSchools, type ISchoolRow } from "../api/admin";
import {
  LinkCell,
  NumberCell,
  type DataTableColumn,
} from "../components/Directory/DataTable";
import { DirectoryView } from "../components/Directory/DirectoryView";
import { VerifiedBadge } from "../components/Directory/VerifiedBadge";

/**
 * The list behind the "schools" tile. Schools appear in the academy as a side
 * effect of a teacher creating a class, so the useful columns are how much of
 * the academy each one actually carries.
 */
export default function SchoolsPage() {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "schools"],
    queryFn: getSchools,
  });

  const columns: DataTableColumn<ISchoolRow>[] = [
    {
      key: "name",
      header: t("directory.colSchool"),
      width: "1.6fr",
      render: (row) => (
        <LinkCell to={`/schools/${row.id}`}>
          {row.name}
          <VerifiedBadge isVerified={row.is_verified} />
        </LinkCell>
      ),
    },
    {
      key: "city",
      header: t("directory.colCity"),
      width: "1fr",
      render: (row) => (
        <LinkCell to={`/cities/${row.city_id}`}>{row.city_name}</LinkCell>
      ),
    },
    {
      key: "teachers",
      header: t("dashboard.teachers"),
      width: "8rem",
      align: "right",
      render: (row) => <NumberCell value={row.teachers_count} />,
    },
    {
      key: "classes",
      header: t("directory.colClasses"),
      width: "7rem",
      align: "right",
      render: (row) => <NumberCell value={row.classes_count} />,
    },
    {
      key: "students",
      header: t("directory.colStudents"),
      width: "7rem",
      align: "right",
      render: (row) => <NumberCell value={row.students_count} accent />,
    },
  ];

  return (
    <DirectoryView
      icon="🏫"
      title={t("dashboard.schools")}
      subtitle={t("directory.schoolsSubtitle")}
      columns={columns}
      rows={data}
      getKey={(row) => row.id}
      searchIn={(row) => [row.name, row.city_name]}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
