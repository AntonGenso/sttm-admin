import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  deleteCity,
  getCities,
  getCity,
  mergeCity,
  readApiError,
  type ISchoolRow,
} from "../api/admin";
import {
  DataTable,
  LinkCell,
  NumberCell,
  type DataTableColumn,
} from "../components/Directory/DataTable";
import {
  DetailLayout,
  InfoGrid,
  Section,
  dangerButtonClass,
  ghostButtonClass,
} from "../components/Directory/DetailLayout";
import { ConfirmDialog } from "../components/Directory/ConfirmDialog";
import { EditCityModal } from "../components/Directory/EditCityModal";
import { MergeModal } from "../components/Directory/MergeModal";
import { VerifiedBadge } from "../components/Directory/VerifiedBadge";

/** Один город: что в нём заведено и как разобрать его дубли. */
export default function CityDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const cityId = Number(id);
  const hasValidId = Number.isInteger(cityId) && cityId > 0;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "city", cityId],
    queryFn: () => getCity(cityId),
    enabled: hasValidId,
  });

  // Список нужен только для выбора цели слияния, поэтому читается по требованию.
  const { data: cities } = useQuery({
    queryKey: ["admin", "cities"],
    queryFn: getCities,
    enabled: isMerging,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    queryClient.invalidateQueries({ queryKey: ["cities"] });
    queryClient.invalidateQueries({ queryKey: ["schools"] });
  };

  const merge = useMutation({
    mutationFn: (targetId: number) => mergeCity(cityId, targetId),
    onSuccess: (target) => {
      invalidate();
      setIsMerging(false);
      // Этого города больше нет — уходим в тот, в который слили.
      navigate(`/cities/${target.id}`);
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteCity(cityId),
    onSuccess: () => {
      invalidate();
      navigate("/cities");
    },
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
      key: "classes",
      header: t("directory.colClasses"),
      width: "7rem",
      align: "right",
      render: (row) => <NumberCell value={row.classes_count} />,
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

  const deleteError = remove.error
    ? (readApiError(remove.error).message ?? t("directory.deleteError"))
    : null;

  const mergeError = merge.error
    ? (() => {
        const { message, details } = readApiError(merge.error);
        return details?.conflicts?.length
          ? `${message} — ${details.conflicts.join(", ")}`
          : (message ?? t("directory.saveError"));
      })()
    : null;

  const isEmpty = data
    ? data.schools_count === 0 && data.teachers_count === 0
    : false;

  return (
    <DetailLayout
      backTo="/cities"
      backLabel={t("directory.backCities")}
      icon="🌍"
      title={data?.name_ru ?? "—"}
      subtitle={data?.region ?? undefined}
      isLoading={isLoading}
      isError={isError || !hasValidId}
      errorMessage={t("directory.cityNotFound")}
      actions={
        data && (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={ghostButtonClass}
            >
              {t("common.edit")}
            </button>
            <button
              type="button"
              onClick={() => setIsMerging(true)}
              className={ghostButtonClass}
            >
              {t("directory.merge")}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirming(true)}
              className={dangerButtonClass}
            >
              {t("common.delete")}
            </button>
          </>
        )
      }
    >
      {data && (
        <>
          <InfoGrid
            items={[
              { label: t("directory.cityNameUz"), value: data.name_uz ?? "—" },
              {
                label: t("directory.cityStatus"),
                value: data.is_active
                  ? t("directory.cityActiveShort")
                  : t("directory.cityInactive"),
              },
              { label: t("dashboard.teachers"), value: data.teachers_count },
              { label: t("directory.colClasses"), value: data.classes_count },
              { label: t("directory.colStudents"), value: data.students_count },
            ]}
          />

          <Section
            title={t("directory.citySchools")}
            count={data.schools.length}
            empty={t("directory.noSchools")}
          >
            <DataTable
              columns={columns}
              rows={data.schools}
              getKey={(row) => row.id}
              minWidth="720px"
            />
          </Section>
        </>
      )}

      {isEditing && data && (
        <EditCityModal data={data} onClose={() => setIsEditing(false)} />
      )}

      {isMerging && data && (
        <MergeModal
          title={t("directory.mergeCity")}
          sourceLabel={data.name_ru}
          description={t("directory.mergeCityDesc")}
          options={
            cities
              ?.filter((city) => city.id !== data.id)
              .map((city) => ({
                id: city.id,
                label: city.name_ru,
                hint: city.region,
              })) ?? []
          }
          emptyMessage={t("directory.cityNotFound")}
          isPending={merge.isPending}
          error={mergeError}
          onConfirm={(targetId) => merge.mutate(targetId)}
          onClose={() => {
            setIsMerging(false);
            merge.reset();
          }}
        />
      )}

      {isConfirming && data && (
        <ConfirmDialog
          title={t("directory.deleteCity")}
          message={t("directory.deleteCityMessage", { name: data.name_ru })}
          // Город со школами или учителями не удаляется вовсе — его сливают с
          // настоящим или деактивируют; диалог говорит это до запроса.
          warning={
            isEmpty
              ? null
              : t("directory.deleteCityBlocked", {
                  schools: data.schools_count,
                  teachers: data.teachers_count,
                })
          }
          confirmLabel={t("common.delete")}
          isPending={remove.isPending}
          error={deleteError}
          onConfirm={() => remove.mutate()}
          onClose={() => {
            setIsConfirming(false);
            remove.reset();
          }}
        />
      )}
    </DetailLayout>
  );
}
