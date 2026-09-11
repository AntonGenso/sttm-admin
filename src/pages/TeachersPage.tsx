import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getTeachers, type ITeacherRow } from "../api/admin";
import {
  LinkCell,
  MonoCell,
  MutedCell,
  NumberCell,
  type DataTableColumn,
} from "../components/Directory/DataTable";
import { DirectoryView } from "../components/Directory/DirectoryView";
import { formatPhoneDisplay } from "../utils/phone";

/** The list behind the "teachers" tile: who teaches, where, and how much. */
export default function TeachersPage() {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "teachers"],
    queryFn: getTeachers,
  });

  const columns: DataTableColumn<ITeacherRow>[] = [
    {
      key: "name",
      header: t("directory.colName"),
      width: "1.4fr",
      render: (row) => (
        <LinkCell to={`/teachers/${row.id}`}>{row.name}</LinkCell>
      ),
    },
    {
      key: "phone",
      header: t("directory.colPhone"),
      width: "11rem",
      render: (row) => <MonoCell>{formatPhoneDisplay(row.phone)}</MonoCell>,
    },
    {
      key: "school",
      header: t("createClass.school"),
      width: "1.2fr",
      // Школа из профиля — то, что учитель указал о себе. Города его классов
      // (`cities`) отвечают на другой вопрос и живут в карточке.
      render: (row) => (
        <MutedCell>
          {row.school_name ?? t("directory.noSchool")}
          {row.city_name && (
            <span className="ml-2 text-base text-grey/70">{row.city_name}</span>
          )}
        </MutedCell>
      ),
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
      icon="🧑‍🏫"
      title={t("dashboard.teachers")}
      subtitle={t("directory.teachersSubtitle")}
      columns={columns}
      rows={data}
      getKey={(row) => row.id}
      searchIn={(row) => [
        row.name,
        row.phone,
        row.cities,
        row.city_name,
        row.school_name,
      ]}
      isLoading={isLoading}
      isError={isError}
    />
  );
}
