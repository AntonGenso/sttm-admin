import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  deleteStudent,
  getStudent,
  readApiError,
  removeEnrollment,
  type IEnrollmentRow,
} from "../api/admin";
import {
  DataTable,
  LinkCell,
  MutedCell,
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
import { StudentProgressList } from "../components/Classes/StudentProgressList";
import { StudentAttempts } from "../components/Classes/StudentAttempts";
import { StatTile } from "../components/Dashboard/StatTile";
import { formatDate } from "../utils/date";
import { formatPhoneDisplay } from "../utils/phone";

/**
 * One student, across the whole academy: their account, every class they are
 * in, and how far they got. The teacher-facing page shows the same report for
 * one class only — here nothing is scoped, because an admin owns none of it.
 */
export default function StudentDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const studentId = Number(id);
  const hasValidId = Number.isInteger(studentId) && studentId > 0;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [leaving, setLeaving] = useState<IEnrollmentRow | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "student", studentId],
    queryFn: () => getStudent(studentId),
    enabled: hasValidId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const remove = useMutation({
    mutationFn: () => deleteStudent(studentId),
    onSuccess: () => {
      invalidate();
      navigate("/students");
    },
  });

  const leaveClass = useMutation({
    mutationFn: (enrollmentId: number) => removeEnrollment(enrollmentId),
    onSuccess: () => {
      invalidate();
      setLeaving(null);
    },
  });

  const columns: DataTableColumn<IEnrollmentRow>[] = [
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
      width: "1.4fr",
      render: (row) => (
        <LinkCell to={`/schools/${row.school_id}`}>{row.school_name}</LinkCell>
      ),
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
      key: "joined",
      header: t("directory.colJoined"),
      width: "8rem",
      render: (row) => <MutedCell>{formatDate(row.joined_at)}</MutedCell>,
    },
    {
      key: "actions",
      header: "",
      width: "7rem",
      align: "right",
      render: (row) => (
        <button
          type="button"
          onClick={() => setLeaving(row)}
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

  const leaveError = leaveClass.error
    ? (readApiError(leaveClass.error).message ?? t("directory.removeError"))
    : null;

  return (
    <DetailLayout
      backTo="/students"
      backLabel={t("directory.backStudents")}
      icon="🧑‍🚀"
      title={data?.name ?? "—"}
      subtitle={data?.class_labels ?? t("directory.noClassYet")}
      isLoading={isLoading}
      isError={isError || !hasValidId}
      errorMessage={t("student.notFound")}
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
              { label: t("directory.colCity"), value: data.cities ?? "—" },
              {
                label: t("directory.colClasses"),
                value: data.classes_count,
              },
              {
                label: t("directory.registered"),
                value: formatDate(data.created_at),
              },
            ]}
          />

          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <li>
              <StatTile
                label={t("student.total")}
                icon="⚡"
                value={data.leaderboard.total}
                hint={t("student.totalHint")}
              />
            </li>
            <li>
              <StatTile
                label={t("student.stars")}
                icon="⭐"
                value={data.leaderboard.stars}
                hint={t("student.starsHint")}
              />
            </li>
            <li>
              <StatTile
                label={t("student.score")}
                icon="🧪"
                value={data.leaderboard.score}
                hint={t("student.scoreHint")}
              />
            </li>
          </ul>

          <Section
            title={t("directory.studentClasses")}
            count={data.memberships.length}
            empty={t("directory.noClassesJoined")}
          >
            <DataTable
              columns={columns}
              rows={data.memberships}
              getKey={(row) => row.id}
              minWidth="760px"
            />
          </Section>

          <StudentProgressList
            title={t("student.missions")}
            items={data.missions}
            emptyHint={t("student.missionsEmpty")}
          />

          <StudentProgressList
            title={t("student.tests")}
            items={data.tests}
            emptyHint={t("student.testsEmpty")}
          />

          <StudentAttempts attempts={data.attempts} />
        </>
      )}

      {isEditing && data && (
        <EditUserModal
          kind="student"
          user={data}
          onClose={() => setIsEditing(false)}
        />
      )}

      {isConfirming && data && (
        <ConfirmDialog
          title={t("directory.deleteStudent")}
          message={t("directory.deleteStudentMessage", { name: data.name })}
          // Unlike leaving a class, this takes the account and everything it
          // earned — there is no version of it that keeps the progress.
          warning={t("directory.deleteStudentWarning")}
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

      {leaving && (
        <ConfirmDialog
          title={t("directory.removeStudent")}
          message={t("directory.leaveClassMessage", {
            name: data?.name ?? "",
            class: `${leaving.grade}${leaving.letter}`,
          })}
          confirmLabel={t("common.remove")}
          isPending={leaveClass.isPending}
          error={leaveError}
          onConfirm={() => leaveClass.mutate(leaving.id)}
          onClose={() => {
            setLeaving(null);
            leaveClass.reset();
          }}
        />
      )}
    </DetailLayout>
  );
}
