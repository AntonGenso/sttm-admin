import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getStudents, type IStudentRow } from "../api/admin";
import {
  LinkCell,
  MonoCell,
  MutedCell,
  NumberCell,
  type DataTableColumn,
} from "../components/Directory/DataTable";
import { DirectoryView } from "../components/Directory/DirectoryView";
import { formatPhoneDisplay } from "../utils/phone";

/**
 * The list behind the "students" tile — every account with the student role,
 * including the ones that have not entered a class code yet. Those show a dash
 * for the class, and they are the gap between this tile and "in classes".
 */
export default function StudentsPage() {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "students"],
    queryFn: getStudents,
  });

  const columns: DataTableColumn<IStudentRow>[] = [
    {
      key: "name",
      header: t("directory.colName"),
      width: "1.4fr",
      render: (row) => (
        <LinkCell to={`/students/${row.id}`}>{row.name}</LinkCell>
      ),
    },
    {
      key: "phone",
      header: t("directory.colPhone"),
      width: "11rem",
      render: (row) => <MonoCell>{formatPhoneDisplay(row.phone)}</MonoCell>,
    },
    {
      key: "city",
      header: t("directory.colCity"),
      width: "1fr",
      render: (row) => <MutedCell>{row.cities ?? "—"}</MutedCell>,
    },
    {
      key: "class",
      header: t("directory.colClass"),
      width: "8rem",
      render: (row) => <MutedCell>{row.class_labels ?? "—"}</MutedCell>,
    },
    {
      key: "stars",
      header: t("classes.colStars"),
      width: "6rem",
      align: "right",
      render: (row) => <NumberCell value={row.stars} />,
    },
    {
      key: "score",
      header: t("classes.colScore"),
      width: "6rem",
      align: "right",
      render: (row) => <NumberCell value={row.score} />,
    },
    {
      key: "total",
      header: t("classes.colTotal"),
      width: "6rem",
      align: "right",
      render: (row) => <NumberCell value={row.total} accent />,
    },
  ];

  return (
    <DirectoryView
      icon="🧑‍🚀"
      title={t("dashboard.students")}
      subtitle={t("directory.studentsSubtitle")}
      columns={columns}
      rows={data}
      getKey={(row) => row.id}
      searchIn={(row) => [row.name, row.phone, row.cities, row.class_labels]}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
