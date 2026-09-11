import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  deleteSchool,
  getSchool,
  getSchools,
  mergeSchool,
  readApiError,
  type IAdminClassRow,
} from "../api/admin";
import {
  DataTable,
  LinkCell,
  MutedCell,
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
import { EditSchoolModal } from "../components/Directory/EditSchoolModal";
import { MergeModal } from "../components/Directory/MergeModal";
import { VerifiedBadge } from "../components/Directory/VerifiedBadge";
import { formatDate } from "../utils/date";

/** One school: where it is, who teaches there, and its classes. */
export default function SchoolDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const schoolId = Number(id);
  const hasValidId = Number.isInteger(schoolId) && schoolId > 0;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "school", schoolId],
    queryFn: () => getSchool(schoolId),
    enabled: hasValidId,
  });

  // Список нужен только для выбора цели слияния, поэтому читается по требованию.
  const { data: schools } = useQuery({
    queryKey: ["admin", "schools"],
    queryFn: getSchools,
    enabled: isMerging,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    queryClient.invalidateQueries({ queryKey: ["schools"] });
  };

  const merge = useMutation({
    mutationFn: (targetId: number) => mergeSchool(schoolId, targetId),
    onSuccess: (target) => {
      invalidate();
      setIsMerging(false);
      // Этой школы больше нет — уходим в ту, в которую слили.
      navigate(`/schools/${target.id}`);
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteSchool(schoolId),
    onSuccess: () => {
      invalidate();
      navigate("/schools");
    },
  });

  const columns: DataTableColumn<IAdminClassRow>[] = [
    {
      key: "class",
      header: t("directory.colClass"),
      width: "7rem",
      render: (row) => (
        <LinkCell to={`/classes/${row.id}`}>
          {row.grade}
          {row.letter}
        </LinkCell>
      ),
    },
    {
      key: "teacher",
      header: t("directory.colTeacher"),
      width: "1.4fr",
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
      render: (row) => <MutedCell>{formatDate(row.created_at)}</MutedCell>,
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

  // Слияние упирается в классы, которые в целевой школе уже есть; сервер
  // возвращает их списком, и показать надо именно его — «конфликт» без имён
  // не подсказывает, что чинить.
  const mergeError = merge.error
    ? (() => {
        const { message, details } = readApiError(merge.error);
        return details?.conflicts?.length
          ? `${message}: ${details.conflicts.join(", ")}`
          : (message ?? t("directory.saveError"));
      })()
    : null;

  return (
    <DetailLayout
      backTo="/schools"
      backLabel={t("directory.backSchools")}
      icon="🏫"
      title={
        <>
          {data?.name ?? "—"}
          {data && <VerifiedBadge isVerified={data.is_verified} />}
        </>
      }
      subtitle={data?.city_name}
      isLoading={isLoading}
      isError={isError || !hasValidId}
      errorMessage={t("directory.schoolNotFound")}
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
              { label: t("directory.colCity"), value: data.city_name },
              {
                label: t("directory.schoolStatus"),
                value: data.is_verified
                  ? t("directory.verified")
                  : t("directory.unverified"),
              },
              { label: t("dashboard.teachers"), value: data.teachers_count },
              { label: t("directory.colClasses"), value: data.classes_count },
              { label: t("directory.colStudents"), value: data.students_count },
            ]}
          />

          <Section
            title={t("directory.schoolClasses")}
            count={data.classes.length}
            empty={t("directory.noClasses")}
          >
            <DataTable
              columns={columns}
              rows={data.classes}
              getKey={(row) => row.id}
              minWidth="720px"
            />
          </Section>
        </>
      )}

      {isEditing && data && (
        <EditSchoolModal data={data} onClose={() => setIsEditing(false)} />
      )}

      {isMerging && data && (
        <MergeModal
          title={t("directory.mergeSchool")}
          sourceLabel={`${data.name}, ${data.city_name}`}
          description={t("directory.mergeSchoolDesc")}
          options={
            schools
              ?.filter((school) => school.id !== data.id)
              .map((school) => ({
                id: school.id,
                label: school.name,
                hint: school.city_name,
              })) ?? []
          }
          emptyMessage={t("directory.noSchools")}
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
          title={t("directory.deleteSchool")}
          message={t("directory.deleteSchoolMessage", { name: data.name })}
          // A school with classes cannot be deleted at all — the classes have to
          // go first — so the dialog says so before the request is even sent.
          warning={
            data.classes_count > 0
              ? t("directory.deleteSchoolBlocked", {
                  classes: data.classes_count,
                })
              : null
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
