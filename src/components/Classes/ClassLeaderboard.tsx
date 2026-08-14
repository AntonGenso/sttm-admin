import { Link } from "react-router-dom";
import type { IClassStudent } from "../../types/classes";

interface Props {
  classId: number;
  students: IClassStudent[];
}

/** Medals for the podium; everyone below just gets their number. */
const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * Ties share a rank: two cadets on 120 points are both 2nd, and the next one
 * down is 4th. The rows arrive already sorted by total, so comparing with the
 * previous row is enough.
 */
const rankOf = (students: IClassStudent[], index: number): number => {
  let rank = 1;
  for (let i = 1; i <= index; i++) {
    if (students[i].total !== students[i - 1].total) {
      rank = i + 1;
    }
  }
  return rank;
};

export const ClassLeaderboard = ({ classId, students }: Props) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] backdrop-blur-md">
      {/* The header labels the four numeric columns the rows below repeat. */}
      <div className="grid grid-cols-[3rem_1fr_5rem_5rem_6rem] items-center gap-3 border-b border-white/10 px-5 py-3 font-mono text-xs tracking-widest text-grey uppercase">
        <span>#</span>
        <span>Cadet</span>
        <span className="text-right">Stars</span>
        <span className="text-right">Score</span>
        <span className="text-right">Total</span>
      </div>

      <ul>
        {students.map((student, index) => {
          const rank = rankOf(students, index);
          const isPodium = rank <= MEDALS.length;

          return (
            <li
              key={student.id}
              className="border-b border-white/5 last:border-b-0"
            >
              {/* The whole row is the link — the columns keep the header's grid. */}
              <Link
                to={`/classes/${classId}/students/${student.id}`}
                className={[
                  "grid grid-cols-[3rem_1fr_5rem_5rem_6rem] items-center gap-3 px-5 py-3 transition-colors hover:bg-cyan-bright/10",
                  isPodium ? "bg-cyan-bright/[0.04]" : "",
                ].join(" ")}
              >
                <span className="text-xl">
                  {isPodium ? (
                    MEDALS[rank - 1]
                  ) : (
                    <span className="font-mono text-lg text-grey">{rank}</span>
                  )}
                </span>

                <div className="min-w-0">
                  <p className="truncate text-2xl font-semibold text-white">
                    {student.name}
                  </p>
                  {/* An invited student stays 'invited' until they play; the
                      teacher should be able to tell them apart from the active ones. */}
                  {student.status !== "active" && (
                    <span className="font-mono text-xs tracking-widest text-orange-bright uppercase">
                      {student.status}
                    </span>
                  )}
                </div>

                <span className="text-right font-mono text-lg text-grey">
                  {student.stars}
                </span>
                <span className="text-right font-mono text-lg text-grey">
                  {student.score}
                </span>
                <span className="text-right font-mono text-xl font-bold text-cyan-bright">
                  {student.total}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
