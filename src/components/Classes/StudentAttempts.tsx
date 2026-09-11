import { useTranslation } from "react-i18next";
import type { IStudentAttempt } from "../../types/classes";
import { formatDateTime } from "../../utils/date";

interface Props {
  attempts: IStudentAttempt[];
}

/** The student's most recent runs, newest first. */
export const StudentAttempts = ({ attempts }: Props) => {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-3xl font-semibold text-white">
        {t("student.recentActivity")}
      </h2>

      {attempts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 bg-[rgba(5,20,30,0.5)] px-5 py-8 text-center text-lg text-grey backdrop-blur-md">
          {t("student.noActivity")}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] backdrop-blur-md">
          {attempts.map((attempt) => (
            <li
              key={attempt.id}
              className="flex items-center justify-between gap-4 border-b border-white/5 px-5 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-xl text-white">
                  {attempt.item_label ?? `#${attempt.item_id}`}
                </p>
                <span className="font-mono text-xs tracking-widest text-grey uppercase">
                  {attempt.kind}
                </span>
              </div>

              <div className="shrink-0 text-right">
                {/* An attempt with no finish is one the cadet is in right now,
                    or one they abandoned — either way it has no score. */}
                <p className="font-mono text-lg text-cyan-bright">
                  {attempt.finished_at
                    ? attempt.score
                    : t("student.inProgress")}
                </p>
                <span className="text-base text-grey">
                  {formatDateTime(attempt.finished_at ?? attempt.started_at)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
