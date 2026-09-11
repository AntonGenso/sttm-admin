import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  deleteTeacher,
  getTeacher,
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
import { EditUserModal } from "../components/Directory/EditUserModal";
import { formatDate } from "../utils/date";
import { formatPhoneDisplay } from "../utils/phone";

/** One teacher: who they are, and every class they run. */
export default function TeacherDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const teacherId = Number(id);
  const hasValidId = Number.isInteger(teacherId) && teacherId > 0;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  /**
   * Set from the server's refusal: deleting a teacher cascades to their
   * classes, so the first attempt comes back with what that would cost and the
   * next one has to say yes to it explicitly.
   */
  const [cascade, setCascade] = useState<{
    classes: number;
    students: number;
  } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "teacher", teacherId],
    queryFn: () => getTeacher(teacherId),
    enabled: hasValidId,
  });

  const remove = useMutation({
    mutationFn: (withCascade: boolean) => deleteTeacher(teacherId, withCascade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      navigate("/teachers");
    },
    onError: (error) => {
      const { status, details } = readApiError(error);
      if (status === 409 && details?.classes) {
        setCascade({
          classes: details.classes,
          students: details.students ?? 0,
        });
      }
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
      key: "school",
      header: t("directory.colSchool"),
      width: "1.4fr",
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

  // The 409 that asks for the cascade is not an error to show twice: it becomes
  // the warning inside the dialog.
  const deleteError =
    remove.error && !cascade
      ? (readApiError(remove.error).message ?? t("directory.deleteError"))
      : null;

  return (
    <DetailLayout
      backTo="/teachers"
      backLabel={t("directory.backTeachers")}
      icon="🧑‍🏫"
      title={data?.name ?? "—"}
      subtitle={data?.cities ?? t("directory.noCity")}
      isLoading={isLoading}
      isError={isError || !hasValidId}
      errorMessage={t("directory.teacherNotFound")}
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
              {
                label: t("directory.colPhone"),
                value: formatPhoneDisplay(data.phone),
              },
              {
                label: t("createClass.school"),
                value: data.school_name ?? t("directory.noSchool"),
              },
              { label: t("directory.colCity"), value: data.city_name ?? "—" },
              // Города его классов — это не то же самое, что город в профиле:
              // класс может быть заведён и в школе другого города.
              { label: t("directory.colTeachesIn"), value: data.cities ?? "—" },
              {
                label: t("directory.colClasses"),
                value: data.classes_count,
              },
              {
                label: t("directory.colStudents"),
                value: data.students_count,
              },
            ]}
          />

          <Section
            title={t("directory.teacherClasses")}
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
        <EditUserModal
          kind="teacher"
          user={data}
          onClose={() => setIsEditing(false)}
        />
      )}

      {isConfirming && data && (
        <ConfirmDialog
          title={t("directory.deleteTeacher")}
          message={t("directory.deleteTeacherMessage", { name: data.name })}
          warning={
            cascade
              ? t("directory.deleteTeacherCascade", {
                  classes: cascade.classes,
                  students: cascade.students,
                })
              : null
          }
          confirmLabel={
            cascade ? t("directory.deleteWithClasses") : t("common.delete")
          }
          isPending={remove.isPending}
          error={deleteError}
          onConfirm={() => remove.mutate(Boolean(cascade))}
          onClose={() => {
            setIsConfirming(false);
            setCascade(null);
            remove.reset();
          }}
        />
      )}
    </DetailLayout>
  );
}
