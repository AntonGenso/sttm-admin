import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { getClassStudent, removeClassStudent } from "../api/classes";
import { StatTile } from "../components/Dashboard/StatTile";
import { StudentProgressList } from "../components/Classes/StudentProgressList";
import { formatDate, formatDateTime } from "../utils/date";

export default function StudentPage() {
  const { id, studentId } = useParams();
  const classId = Number(id);
  const cadetId = Number(studentId);
  const hasValidIds =
    Number.isInteger(classId) &&
    classId > 0 &&
    Number.isInteger(cadetId) &&
    cadetId > 0;

  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["classes", classId, "students", cadetId],
    queryFn: () => getClassStudent(classId, cadetId),
    enabled: hasValidIds,
  });

  const {
    mutate: removeFromClass,
    isPending: isRemoving,
    error: removeError,
  } = useMutation({
    mutationFn: () => removeClassStudent(classId, cadetId),
    onSuccess: () => {
      // This page has nothing left to show — the student is no longer in the
      // class, so the roster is where the teacher belongs.
      queryClient.removeQueries({
        queryKey: ["classes", classId, "students", cadetId],
      });
      queryClient.invalidateQueries({
        queryKey: ["classes", classId, "students"],
      });
      // The card on the home page carries the student count.
      queryClient.invalidateQueries({ queryKey: ["classes", "my"] });
      navigate(`/classes/${classId}`);
    },
  });

  const removeErrorMessage = axios.isAxiosError(removeError)
    ? ((removeError.response?.data as { message?: string } | undefined)
        ?.message ?? "Could not remove the student")
    : removeError
      ? "Could not remove the student"
      : null;

  // A student outside the teacher's classes comes back as a 404, same as a
  // class that isn't theirs — from here the two are indistinguishable.
  const isMissing =
    !hasValidIds ||
    (axios.isAxiosError(error) && error.response?.status === 404);

  const backLink = hasValidIds ? `/classes/${classId}` : "/";

  if (isMissing) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-5xl font-bold tracking-wide text-white">
          Student not found
        </h1>
        <p className="text-xl text-grey">
          They may have left the class, or they belong to another teacher.
        </p>
        <Link
          to={backLink}
          className="rounded-full border border-cyan-bright/40 px-5 py-2 text-lg text-cyan-bright transition-colors hover:bg-cyan-bright/10"
        >
          Back to the class
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          to={backLink}
          className="w-fit font-mono text-xs tracking-widest text-cyan-bright uppercase transition-opacity hover:opacity-75"
        >
          ← Back to class
        </Link>

        {isLoading && <span className="text-lg text-grey">Loading...</span>}

        {error && !isMissing && (
          <p className="text-lg text-error">Could not load the student</p>
        )}

        {data && (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-5xl font-bold tracking-wide text-white">
                {data.name}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xl text-grey">
                <span>Joined {formatDate(data.joined_at)}</span>
                <span aria-hidden>·</span>
                <span>{data.phone ?? "No phone"}</span>
                {data.status !== "active" && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="font-mono text-xs tracking-widest text-orange-bright uppercase">
                      {data.status}
                    </span>
                  </>
                )}
              </p>
            </div>

            {isConfirmingRemove ? (
              <div className="flex max-w-[340px] flex-col items-end gap-2">
                <p className="text-right text-base text-grey">
                  Remove {data.name} from the class? Their progress is kept —
                  they can join another class with its code.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingRemove(false)}
                    className="rounded-full border border-white/20 px-4 py-1.5 text-base text-grey transition-colors hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromClass()}
                    disabled={isRemoving}
                    className="rounded-full bg-orange-bright/90 px-4 py-1.5 text-base font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                  >
                    {isRemoving ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmingRemove(true)}
                className="rounded-full border border-orange-bright/40 px-5 py-2 text-lg text-orange-bright transition-colors hover:bg-orange-bright/10"
              >
                Remove from class
              </button>
            )}
          </div>
        )}

        {removeErrorMessage && (
          <p className="text-lg text-error">{removeErrorMessage}</p>
        )}
      </div>

      {data && (
        <>
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
            <li>
              <StatTile
                label="Rank"
                icon="🏅"
                value={data.class_rank}
                hint="Place in this class"
              />
            </li>
            <li>
              <StatTile
                label="Total"
                icon="⚡"
                value={data.leaderboard.total}
                hint="Stars plus score"
              />
            </li>
            <li>
              <StatTile
                label="Stars"
                icon="⭐"
                value={data.leaderboard.stars}
                hint="Earned across missions"
              />
            </li>
            <li>
              <StatTile
                label="Score"
                icon="🧪"
                value={data.leaderboard.score}
                hint="Earned across tests"
              />
            </li>
          </ul>

          <StudentProgressList
            title="Missions"
            items={data.missions}
            emptyHint="There are no missions in the academy yet."
          />

          <StudentProgressList
            title="Tests"
            items={data.tests}
            emptyHint="There are no tests in the academy yet."
          />

          <section className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold text-white">
              Recent activity
            </h2>

            {data.attempts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/15 bg-[rgba(5,20,30,0.5)] px-5 py-8 text-center text-lg text-grey backdrop-blur-md">
                This cadet has not started anything yet.
              </p>
            ) : (
              <ul className="overflow-hidden rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] backdrop-blur-md">
                {data.attempts.map((attempt) => (
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
                      {/* An attempt with no finish is one the cadet is in right
                          now, or one they abandoned — either way it has no score. */}
                      <p className="font-mono text-lg text-cyan-bright">
                        {attempt.finished_at ? attempt.score : "In progress"}
                      </p>
                      <span className="text-base text-grey">
                        {formatDateTime(
                          attempt.finished_at ?? attempt.started_at,
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
