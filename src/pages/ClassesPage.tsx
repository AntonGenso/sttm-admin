import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getAllClasses, type IAdminClassRow } from "../api/admin";
import {
  LinkCell,
  MonoCell,
  MutedCell,
  NumberCell,
  type DataTableColumn,
} from "../components/Directory/DataTable";
import { DirectoryView } from "../components/Directory/DirectoryView";
import { formatDate } from "../utils/date";

/** The list behind the "classes" tile: every class of every teacher. */
export default function ClassesPage() {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "classes"],
    queryFn: getAllClasses,
  });

  const columns: DataTableColumn<IAdminClassRow>[] = [
    {
      key: "class",
      header: t("directory.colClass"),
      width: "8rem",
      render: (row) => (
        <div className="flex items-center gap-2">
          <LinkCell to={`/classes/${row.id}`}>
            {row.grade}
            {row.letter}
          </LinkCell>
          {/* An archived class still counts towards the tile, so it stays on
              the list and is marked instead of being hidden. */}
          {row.is_active === 0 && (
            <span className="font-mono text-xs tracking-widest text-orange-bright uppercase">
              {t("directory.archived")}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "school",
      header: t("directory.colSchool"),
      width: "1.3fr",
      render: (row) => (
        <LinkCell to={`/schools/${row.school_id}`}>{row.school_name}</LinkCell>
      ),
    },
    {
      key: "city",
      header: t("directory.colCity"),
      width: "1fr",
      render: (row) => <MutedCell>{row.city_name}</MutedCell>,
    },
    {
      key: "teacher",
      header: t("directory.colTeacher"),
      width: "1.2fr",
      render: (row) =>
        row.teacher_id ? (
          <LinkCell to={`/teachers/${row.teacher_id}`}>
            {row.teacher_name}
          </LinkCell>
        ) : (
          <MutedCell>—</MutedCell>
        ),
    },
    {
      key: "created",
      header: t("directory.colCreated"),
      width: "8rem",
      render: (row) => <MonoCell>{formatDate(row.created_at)}</MonoCell>,
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
      icon="🛰️"
      title={t("dashboard.classes")}
      subtitle={t("directory.classesSubtitle")}
      columns={columns}
      rows={data}
      getKey={(row) => row.id}
      searchIn={(row) => [
        `${row.grade}${row.letter}`,
        row.school_name,
        row.city_name,
        row.teacher_name,
      ]}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
