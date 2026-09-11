import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getEnrollments, type IEnrollmentRow } from "../api/admin";
import {
  LinkCell,
  MonoCell,
  MutedCell,
  NumberCell,
  type DataTableColumn,
} from "../components/Directory/DataTable";
import { DirectoryView } from "../components/Directory/DirectoryView";
import { formatDate } from "../utils/date";

/**
 * The list behind the "in classes" tile: one row per live membership, newest
 * first. A student who joined two classes appears twice — that is exactly what
 * the counter counts, and merging the rows here would make the two disagree.
 */
export default function EnrollmentsPage() {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "enrollments"],
    queryFn: getEnrollments,
  });

  const columns: DataTableColumn<IEnrollmentRow>[] = [
    {
      key: "student",
      header: t("directory.colStudent"),
      width: "1.3fr",
      render: (row) => (
        <div className="min-w-0">
          <LinkCell to={`/students/${row.student_id}`}>
            {row.student_name}
          </LinkCell>
          {row.status !== "active" && (
            <span className="font-mono text-xs tracking-widest text-orange-bright uppercase">
              {row.status}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "class",
      header: t("directory.colClass"),
      width: "6rem",
      render: (row) => (
        <LinkCell to={`/classes/${row.class_id}`}>
          {row.grade}
          {row.letter}
        </LinkCell>
      ),
    },
    {
      key: "school",
      header: t("directory.colSchool"),
      width: "1.2fr",
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
      width: "1.1fr",
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
      key: "joined",
      header: t("directory.colJoined"),
      width: "8rem",
      render: (row) => <MonoCell>{formatDate(row.joined_at)}</MonoCell>,
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
      icon="🎟️"
      title={t("dashboard.inClasses")}
      subtitle={t("directory.enrollmentsSubtitle")}
      columns={columns}
      rows={data}
      getKey={(row) => row.id}
      searchIn={(row) => [
        row.student_name,
        row.student_phone,
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
