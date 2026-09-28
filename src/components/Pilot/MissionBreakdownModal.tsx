import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  getClassMissionStudents,
  type IPilotStudent,
  type StudentBucket,
} from "../../api/pilot";
import { formatLessonDate } from "../../utils/date";

interface Props {
  classId: number;
  missionId: number;
  onClose: () => void;
}

/** Порядок групп — путь ученика: дошёл, застрял, не начинал. */
const BUCKETS: StudentBucket[] = ["done", "in_progress", "none"];

const BUCKET_STYLE: Record<StudentBucket, string> = {
  done: "border-cyan-bright/50 bg-cyan-bright/10 text-cyan-bright",
  in_progress: "border-orange-bright/50 bg-orange-bright/10 text-orange-bright",
  none: "border-white/10 bg-white/[0.03] text-grey",
};

const StudentRow = ({ student }: { student: IPilotStudent }) => {
  const { t } = useTranslation();

  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-white/5 py-1.5 last:border-0">
      <span className="truncate text-lg text-white">{student.name}</span>
      {student.bucket === "done" && (
        <span className="shrink-0 font-mono text-sm text-grey">
          {formatLessonDate(student.first_completed_at)}
          {student.best_score !== null && ` · ${student.best_score}`}
          {/* Показываем только переcдачи: «1 попытка» — шум в каждой строке. */}
          {student.attempts !== null && student.attempts > 1 && (
            <span className="text-orange-bright">
              {" "}
              · {t("pilot.attemptsShort", { n: student.attempts })}
            </span>
          )}
        </span>
      )}
    </li>
  );
};

/**
 * Поимённый состав за одной клеткой отчёта.
 *
 * Отчёт отвечает «сколько», эта модалка — «кто именно», потому что сделать
 * что-то можно только со вторым: позвонить учителю про конкретных детей, а не
 * про цифру 3.
 */
export const MissionBreakdownModal = ({
  classId,
  missionId,
  onClose,
}: Props) => {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "pilot-breakdown", classId, missionId],
    queryFn: () => getClassMissionStudents(classId, missionId),
  });

  // Escape закрывает — модалка только читает, терять в ней нечего.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const groups = BUCKETS.map((bucket) => ({
    bucket,
    students: data?.students.filter((s) => s.bucket === bucket) ?? [],
  }));

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-[560px] flex-col gap-5 overflow-y-auto rounded-2xl border border-cyan-bright/40 bg-[rgba(7,21,42,0.95)] p-7 backdrop-blur-xl"
      >
        <div>
          <h2 className="text-3xl font-bold text-white">
            {data ? `M${data.mission.level} ${data.mission.label}` : "…"}
          </h2>
          {data && (
            <p className="mt-1 text-lg text-grey">
              {data.class.label} · {data.class.school_name} ·{" "}
              {data.class.teacher_name}
            </p>
          )}
        </div>

        {isLoading && <p className="text-lg text-grey">{t("common.loading")}</p>}
        {isError && (
          <p className="text-lg text-error">{t("pilot.breakdownError")}</p>
        )}

        {data && !data.mission.has_test && (
          <p className="text-base text-orange-bright">{t("pilot.noTest")}</p>
        )}

        {data &&
          groups.map(({ bucket, students }) => (
            <section key={bucket} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-lg border px-3 py-1 font-mono text-xs tracking-widest uppercase ${BUCKET_STYLE[bucket]}`}
                >
                  {t(`pilot.bucket_${bucket}`)}
                </span>
                <span className="text-lg text-grey">{students.length}</span>
              </div>

              {students.length > 0 ? (
                <ul className="flex flex-col">
                  {students.map((student) => (
                    <StudentRow key={student.id} student={student} />
                  ))}
                </ul>
              ) : (
                <p className="text-base text-grey/60">
                  {/* Пустая «начали и не закончили» — не случайность, а
                      следствие того, что игра не сообщает о старте. */}
                  {bucket === "in_progress"
                    ? t("pilot.bucketInProgressEmpty")
                    : t("pilot.bucketEmpty")}
                </p>
              )}
            </section>
          ))}

        <button
          type="button"
          onClick={onClose}
          className="mt-auto self-end rounded-full border border-cyan-bright/40 px-5 py-2 text-lg text-cyan-bright transition-colors hover:bg-cyan-bright/10"
        >
          {t("common.close")}
        </button>
      </div>
    </div>
  );
};
