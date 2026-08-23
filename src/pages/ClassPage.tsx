import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getClass, getClassStudents } from "../api/classes";
import { ClassLeaderboard } from "../components/Classes/ClassLeaderboard";
import { ClassStudents } from "../components/Classes/ClassStudents";

type Tab = "students" | "leaderboard";

const TABS: { key: Tab; labelKey: string }[] = [
  { key: "students", labelKey: "classes.tabStudents" },
  { key: "leaderboard", labelKey: "classes.tabLeaderboard" },
];

// Same pill as the header navigation, so a tab reads as a tab everywhere.
const tabClass = (isActive: boolean) =>
  [
    "rounded-full px-5 py-1.5 text-2xl font-medium tracking-wide transition-colors",
    isActive
      ? "bg-cyan-bright/15 text-cyan-bright"
      : "text-grey hover:text-white",
  ].join(" ");

export default function ClassPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const classId = Number(id);
  const isValidId = Number.isInteger(classId) && classId > 0;

  const [tab, setTab] = useState<Tab>("students");

  const {
    data: classData,
    isLoading: isClassLoading,
    error: classError,
  } = useQuery({
    queryKey: ["classes", classId],
    queryFn: () => getClass(classId),
    enabled: isValidId,
  });

  const {
    data: students,
    isLoading: areStudentsLoading,
    isError: isStudentsError,
  } = useQuery({
    queryKey: ["classes", classId, "students"],
    queryFn: () => getClassStudents(classId),
    enabled: isValidId,
  });

  // A class that belongs to another teacher comes back as a 404 — from the
  // caller's side it simply does not exist.
  const isMissing =
    !isValidId ||
    (axios.isAxiosError(classError) && classError.response?.status === 404);

  if (isMissing) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-5xl font-bold tracking-wide text-white">
          {t("classes.notFound")}
        </h1>
        <p className="text-xl text-grey">{t("classes.notFoundDesc")}</p>
        <Link
          to="/"
          className="rounded-full border border-cyan-bright/40 px-5 py-2 text-lg text-cyan-bright transition-colors hover:bg-cyan-bright/10"
        >
          {t("classes.backToClasses")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          to="/"
          className="w-fit font-mono text-xs tracking-widest text-cyan-bright uppercase transition-opacity hover:opacity-75"
        >
          {t("classes.myClassesBack")}
        </Link>

        {isClassLoading && (
          <span className="text-lg text-grey">{t("common.loading")}</span>
        )}

        {classError && !isMissing && (
          <p className="text-lg text-error">{t("classes.loadError")}</p>
        )}

        {classData && (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-5xl font-bold tracking-wide text-white">
                {classData.grade}
                {classData.letter}
              </h1>
              <p className="mt-1 text-xl text-grey">
                {classData.school_name} · {classData.city_name}
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs tracking-widest text-grey uppercase">
                {t("classes.joinCode")}
              </span>
              <span className="rounded-lg border border-cyan-bright/30 bg-[rgba(2,37,51,0.6)] px-4 py-2 font-mono text-2xl tracking-[0.3em] text-cyan-bright">
                {classData.join_code}
              </span>
            </div>
          </div>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {TABS.map(({ key, labelKey }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={tabClass(tab === key)}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>

          {students && (
            <span className="text-lg text-grey">
              {t("classes.cadet", { count: students.length })}
            </span>
          )}
        </div>

        {areStudentsLoading && (
          <span className="text-lg text-grey">{t("common.loading")}</span>
        )}

        {isStudentsError && (
          <p className="text-lg text-error">{t("classes.studentsLoadError")}</p>
        )}

        {/* Both tabs would show the same "nobody here" message, so the page
            answers it once instead of switching between two empty views. */}
        {students?.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-cyan-bright/35 bg-[rgba(5,20,30,0.5)] px-6 py-12 text-center backdrop-blur-md">
            <span className="font-mono text-xs tracking-widest text-cyan-bright uppercase">
              {t("classes.emptyClass")}
            </span>
            <h3 className="text-3xl font-semibold text-white">
              {t("classes.noCadets")}
            </h3>
            <p className="max-w-[420px] text-lg text-grey">
              {t("classes.shareCode")}
            </p>
          </div>
        )}

        {students && students.length > 0 && tab === "students" && (
          <ClassStudents classId={classId} students={students} />
        )}

        {students && students.length > 0 && tab === "leaderboard" && (
          <ClassLeaderboard classId={classId} students={students} />
        )}
      </section>
    </div>
  );
}
