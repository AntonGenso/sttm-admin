import type { IStudentProgressItem, ProgressStatus } from "../../types/classes";
import { formatDate } from "../../utils/date";

interface Props {
  title: string;
  /** The whole catalog with this student's progress, untouched items included. */
  items: IStudentProgressItem[];
  emptyHint: string;
}

const STATUS_LABEL: Record<ProgressStatus, string> = {
  done: "Done",
  in_progress: "In progress",
  open: "Not started",
};

const STATUS_CLASS: Record<ProgressStatus, string> = {
  done: "border-success/40 bg-success/10 text-success",
  in_progress: "border-orange-bright/40 bg-orange-bright/10 text-orange-bright",
  open: "border-white/15 text-grey",
};

export const StudentProgressList = ({ title, items, emptyHint }: Props) => {
  const completed = items.filter((item) => item.status === "done").length;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-3xl font-semibold text-white">{title}</h2>
        {items.length > 0 && (
          <span className="text-lg text-grey">
            {completed} / {items.length} completed
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 bg-[rgba(5,20,30,0.5)] px-5 py-8 text-center text-lg text-grey backdrop-blur-md">
          {emptyHint}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] backdrop-blur-md">
          <div className="grid grid-cols-[1fr_8rem_5rem_5rem_7rem] items-center gap-3 border-b border-white/10 px-5 py-3 font-mono text-xs tracking-widest text-grey uppercase">
            <span>Name</span>
            <span>Status</span>
            <span className="text-right">Best</span>
            <span className="text-right">Tries</span>
            <span className="text-right">Completed</span>
          </div>

          <ul>
            {items.map((item) => (
              <li
                key={item.id}
                className="grid grid-cols-[1fr_8rem_5rem_5rem_7rem] items-center gap-3 border-b border-white/5 px-5 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-xl text-white">
                    {item.label || item.name}
                  </p>
                  {Boolean(item.xp) && (
                    <span className="font-mono text-xs text-cyan-bright">
                      {item.xp} XP
                    </span>
                  )}
                </div>

                <span
                  className={`w-fit rounded-full border px-3 py-0.5 font-mono text-xs tracking-widest uppercase ${STATUS_CLASS[item.status]}`}
                >
                  {STATUS_LABEL[item.status]}
                </span>

                <span className="text-right font-mono text-lg text-white">
                  {item.best_score}
                </span>
                <span className="text-right font-mono text-lg text-grey">
                  {item.attempts}
                </span>
                <span className="text-right text-base text-grey">
                  {formatDate(item.completed_at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
