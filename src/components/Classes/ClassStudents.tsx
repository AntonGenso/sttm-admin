import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { IClassStudent } from "../../types/classes";

interface Props {
  classId: number;
  students: IClassStudent[];
}

type SortDirection = "asc" | "desc";

/** The roster: who is in the class, findable by nickname. */
export const ClassStudents = ({ classId, students }: Props) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [direction, setDirection] = useState<SortDirection>("asc");

  const needle = query.trim().toLowerCase();
  const found = needle
    ? students.filter((student) => student.name.toLowerCase().includes(needle))
    : students;

  // `localeCompare` so «Ася» and "Alex" both land where a teacher expects them;
  // the list arrives in leaderboard order, so it always needs re-sorting here.
  const visible = [...found].sort((a, b) =>
    direction === "asc"
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("classes.searchPlaceholder")}
          className="min-w-[240px] flex-1 rounded-full border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] px-5 py-2 text-lg text-white placeholder:text-grey/70 focus:border-cyan-bright/60 focus:outline-none"
        />

        <button
          type="button"
          onClick={() => setDirection(direction === "asc" ? "desc" : "asc")}
          className="rounded-full border border-cyan-bright/40 px-5 py-2 text-base text-cyan-bright transition-colors hover:bg-cyan-bright/10"
        >
          {t("classes.sortNickname")}{" "}
          {direction === "asc" ? t("classes.azAsc") : t("classes.azDesc")}
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/15 bg-[rgba(5,20,30,0.5)] px-5 py-8 text-center text-lg text-grey backdrop-blur-md">
          {t("classes.noMatch", { query: query.trim() })}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((student) => (
            <li key={student.id}>
              <Link
                to={`/classes/${classId}/students/${student.id}`}
                className="flex h-full items-center gap-3 rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] p-5 backdrop-blur-md transition-colors hover:border-cyan-bright/60 hover:bg-cyan-bright/5"
              >
                <span
                  aria-hidden
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[rgba(2,37,51,0.6)] text-xl"
                >
                  🧑‍🚀
                </span>
                <div className="min-w-0">
                  <p className="truncate text-2xl font-semibold text-white">
                    {student.name}
                  </p>
                  {student.status !== "active" && (
                    <span className="font-mono text-xs tracking-widest text-orange-bright uppercase">
                      {student.status}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
