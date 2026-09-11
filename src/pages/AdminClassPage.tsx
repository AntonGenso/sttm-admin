import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  deleteClass,
  getAdminClass,
  readApiError,
  removeEnrollment,
  updateClass,
  type IAdminClassStudent,
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
import { EditClassModal } from "../components/Directory/EditClassModal";
import { formatDate } from "../utils/date";

/**
 * One class, as the academy sees it — any teacher's, not only the caller's.
 * The invite code is shown but not re-issued here: rotating it is the owning
 * teacher's operation on their own class.
 */
export default function AdminClassPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const classId = Number(id);
  const hasValidId = Number.isInteger(classId) && classId > 0;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  /** The membership being ended, kept so the dialog can name the student. */
  const [removing, setRemoving] = useState<IAdminClassStudent | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "class", classId],
    queryFn: () => getAdminClass(classId),
    enabled: hasValidId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const toggleActive = useMutation({
    mutationFn: (isActive: boolean) => updateClass(classId, { isActive }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: () => deleteClass(classId),
    onSuccess: () => {
      invalidate();
      navigate("/classes");
    },
  });

  const removeStudent = useMutation({
    mutationFn: (enrollmentId: number) => removeEnrollment(enrollmentId),
    onSuccess: () => {
      invalidate();
      setRemoving(null);
    },
  });

  const columns: DataTableColumn<IAdminClassStudent>[] = [
    {
      key: "student",
      header: t("directory.colStudent"),
      width: "1.6fr",
      render: (row) => (
        <LinkCell to={`/students/${row.id}`}>{row.name}</LinkCell>
      ),
    },
    {
      key: "joined",
      header: t("directory.colJoined"),
      width: "8rem",
      render: (row) => <MutedCell>{formatDate(row.joined_at)}</MutedCell>,
    },
    {
      key: "stars",
      header: t("classes.colStars"),
      width: "5rem",
      align: "right",
      render: (row) => <NumberCell value={row.stars} />,
    },
    {
      key: "score",
      header: t("classes.colScore"),
      width: "5rem",
      align: "right",
      render: (row) => <NumberCell value={row.score} />,
    },
    {
      key: "total",
      header: t("classes.colTotal"),
      width: "5rem",
      align: "right",
      render: (row) => <NumberCell value={row.total} accent />,
    },
    {
      key: "actions",
      header: "",
      width: "7rem",
      align: "right",
      render: (row) => (
        <button
          type="button"
          onClick={() => setRemoving(row)}
          className="text-base text-error transition-opacity hover:opacity-75"
        >
          {t("common.remove")}
        </button>
      ),
    },
  ];

  const deleteError = remove.error
    ? (readApiError(remove.error).message ?? t("directory.deleteError"))
    : null;

  const removeStudentError = removeStudent.error
    ? (readApiError(removeStudent.error).message ?? t("directory.removeError"))
    : null;

  return (
    <DetailLayout
      backTo="/classes"
      backLabel={t("directory.backClasses")}
      icon="🛰️"
      title={data ? `${data.grade}${data.letter}` : "—"}
      subtitle={data ? `${data.school_name}, ${data.city_name}` : undefined}
      isLoading={isLoading}
      isError={isError || !hasValidId}
      errorMessage={t("classes.notFound")}
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
            {/* Archiving is the reversible half of deleting: the class stops
                being live, but its roster and progress stay untouched. */}
            <button
              type="button"
              disabled={toggleActive.isPending}
              onClick={() => toggleActive.mutate(data.is_active === 0)}
              className={ghostButtonClass}
            >
              {data.is_active === 1
                ? t("directory.archive")
                : t("directory.unarchive")}
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
                label: t("directory.colTeacher"),
                value: data.teacher_id ? (
                  <LinkCell to={`/teachers/${data.teacher_id}`}>
                    {data.teacher_name}
                  </LinkCell>
                ) : (
                  "—"
                ),
              },
              {
                label: t("directory.colSchool"),
                value: (
                  <LinkCell to={`/schools/${data.school_id}`}>
                    {data.school_name}
                  </LinkCell>
                ),
              },
              {
                label: t("classes.joinCode"),
                value: (
                  <span className="font-mono tracking-widest text-cyan-bright">
                    {data.join_code}
                  </span>
                ),
              },
              {
                label: t("directory.colCreated"),
                value: formatDate(data.created_at),
              },
            ]}
          />

          {data.is_active === 0 && (
            <p className="text-lg text-orange-bright">
              {t("directory.classArchived")}
            </p>
          )}

          <Section
            title={t("classes.tabStudents")}
            count={data.students.length}
            empty={t("classes.noCadets")}
          >
            <DataTable
              columns={columns}
              rows={data.students}
              getKey={(row) => row.enrollment_id}
              minWidth="720px"
            />
          </Section>
        </>
      )}

      {isEditing && data && (
        <EditClassModal data={data} onClose={() => setIsEditing(false)} />
      )}

      {isConfirming && data && (
        <ConfirmDialog
          title={t("directory.deleteClass")}
          message={t("directory.deleteClassMessage", {
            name: `${data.grade}${data.letter}`,
          })}
          warning={
            data.students.length > 0
              ? t("directory.deleteClassWarning", {
                  count: data.students.length,
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

      {removing && (
        <ConfirmDialog
          title={t("directory.removeStudent")}
          message={t("directory.removeStudentMessage", { name: removing.name })}
          confirmLabel={t("common.remove")}
          isPending={removeStudent.isPending}
          error={removeStudentError}
          onConfirm={() => removeStudent.mutate(removing.enrollment_id)}
          onClose={() => {
            setRemoving(null);
            removeStudent.reset();
          }}
        />
      )}
    </DetailLayout>
  );
}
