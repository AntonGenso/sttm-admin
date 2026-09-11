import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getCities, type ICityRow } from "../api/admin";
import {
  LinkCell,
  MutedCell,
  NumberCell,
  type DataTableColumn,
} from "../components/Directory/DataTable";
import { DirectoryView } from "../components/Directory/DirectoryView";
import { EditCityModal } from "../components/Directory/EditCityModal";

/**
 * Справочник городов.
 *
 * Единственный список в панели, который админ не только разбирает, но и
 * пополняет: города в приложении больше не вводятся руками, и всё, что не
 * заведено здесь, учителю недоступно.
 */
export default function CitiesPage() {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "cities"],
    queryFn: getCities,
  });

  const columns: DataTableColumn<ICityRow>[] = [
    {
      key: "name",
      header: t("directory.colCity"),
      width: "1.4fr",
      render: (row) => (
        <LinkCell to={`/cities/${row.id}`}>
          {row.name_ru}
          {!row.is_active && (
            <span className="ml-2 text-base text-orange-bright">
              {t("directory.cityInactive")}
            </span>
          )}
        </LinkCell>
      ),
    },
    {
      key: "region",
      header: t("directory.colRegion"),
      width: "1.2fr",
      render: (row) => <MutedCell>{row.region ?? "—"}</MutedCell>,
    },
    {
      key: "schools",
      header: t("dashboard.schools"),
      width: "7rem",
      align: "right",
      render: (row) => <NumberCell value={row.schools_count} />,
    },
    {
      key: "teachers",
      header: t("dashboard.teachers"),
      width: "8rem",
      align: "right",
      render: (row) => <NumberCell value={row.teachers_count} />,
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
    <>
      <DirectoryView
        icon="🌍"
        title={t("dashboard.cities")}
        subtitle={t("directory.citiesSubtitle")}
        columns={columns}
        rows={data}
        getKey={(row) => row.id}
        searchIn={(row) => [row.name_ru, row.name_uz, row.region]}
        isLoading={isLoading}
        isError={isError}
        action={
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-5 py-2 text-lg font-bold text-white transition-opacity hover:opacity-85"
          >
            {t("directory.newCity")}
          </button>
        }
      />

      {isCreating && <EditCityModal onClose={() => setIsCreating(false)} />}
    </>
  );
}
