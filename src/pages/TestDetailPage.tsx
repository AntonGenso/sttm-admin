import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getTest } from "../api/tests";
import { TestFormModal } from "../components/Tests/TestFormModal";
import { OPTION_LETTERS } from "../types/tests";
import type { ITestQuestion } from "../types/tests";
import missionDefaultCover from "../assets/mission-default.svg";
import { toAssetUrl } from "../utils/assetUrl";
import { formatOpensAt, isUpcoming } from "../utils/date";
import { useAuthStore } from "../store/authStore";

const labelClass =
  "font-mono text-xs uppercase tracking-widest text-cyan-bright";

/**
 * One question with its four options, the right one marked.
 *
 * Read-only by design: this is the view a teacher gets, and the whole point of
 * it is seeing the answer key. Editing lives in the modal, behind the admin
 * check.
 */
const QuestionCard = ({
  question,
  number,
}: {
  question: ITestQuestion;
  number: number;
}) => {
  const { t } = useTranslation();

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] p-5 backdrop-blur-md">
      <div className="flex flex-col gap-1">
        <span className={labelClass}>
          {t("testDetail.question", { number })}
        </span>
        <p className="text-xl text-white">{question.text.ru}</p>
        {question.text.uz && (
          <p className="text-lg text-grey">{question.text.uz}</p>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {OPTION_LETTERS.map((letter) => {
          const isCorrect = question.correct_option === letter;
          const option = question.options[letter];

          return (
            <li
              key={letter}
              className={`flex items-start gap-3 rounded-xl border px-4 py-2.5 ${
                isCorrect
                  ? "border-[#22c55e]/50 bg-[#22c55e]/10"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <span
                className={`mt-0.5 font-mono text-base font-bold ${
                  isCorrect ? "text-[#4ade80]" : "text-grey"
                }`}
              >
                {letter}
              </span>
              <div className="min-w-0 flex-1">
                <p className={isCorrect ? "text-white" : "text-grey"}>
                  {option.ru}
                </p>
                {option.uz && (
                  <p className="text-base text-grey/70">{option.uz}</p>
                )}
              </div>
              {isCorrect && (
                <span className="shrink-0 rounded-full bg-[#22c55e]/20 px-2.5 py-0.5 font-mono text-xs uppercase tracking-widest text-[#4ade80]">
                  {t("testDetail.correct")}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </li>
  );
};

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const testId = Number(id);
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  const isAdmin = useAuthStore((state) => state.hasRole("admin"));

  const { data: test, isLoading, error } = useQuery({
    queryKey: ["test", testId],
    queryFn: () => getTest(testId),
    enabled: Number.isInteger(testId) && testId > 0,
  });

  const errorMessage = axios.isAxiosError(error)
    ? error.response?.status === 403
      ? t("testDetail.staffOnly")
      : t("testDetail.loadError")
    : error
      ? t("testDetail.loadError")
      : null;

  const isScheduled = isUpcoming(test?.opens_at);

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <Link
        to="/tests"
        className="w-fit text-lg text-grey transition-colors hover:text-white"
      >
        ← {t("tests.title")}
      </Link>

      {isLoading && <span className="text-lg text-grey">{t("common.loading")}</span>}
      {errorMessage && <p className="text-lg text-error">{errorMessage}</p>}

      {test && (
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[rgba(2,37,51,0.6)]">
              <img
                src={toAssetUrl(test.cover_url) || missionDefaultCover}
                alt={test.label ?? test.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <span className={labelClass}>
                {t("tests.levelBadge", {
                  level: String(test.level).padStart(2, "0"),
                })}
              </span>
              <h1 className="text-5xl font-bold tracking-wide text-white">
                {test.label ?? test.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm text-cyan-bright">
                  {test.xp} XP
                </span>
                <span className="font-mono text-sm text-grey">
                  {t("tests.questionCount", { count: test.questions.length })}
                </span>
                {test.is_active === 0 && (
                  <span className="rounded-full bg-black/60 px-2.5 py-1 font-mono text-xs uppercase tracking-widest text-grey">
                    {t("tests.hidden")}
                  </span>
                )}
                {test.opens_at && (
                  <span
                    className={`rounded-lg border px-3 py-1 font-mono text-sm tracking-wide ${
                      isScheduled
                        ? "border-orange-bright/40 bg-orange-bright/10 text-orange-bright"
                        : "border-white/10 bg-white/[0.03] text-grey"
                    }`}
                  >
                    {isScheduled
                      ? t("tests.opensAt", { date: formatOpensAt(test.opens_at) })
                      : t("tests.openedSince", {
                          date: formatOpensAt(test.opens_at),
                        })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-full border border-cyan-bright/40 px-5 py-2 text-lg text-cyan-bright transition-colors hover:bg-cyan-bright/10"
            >
              {t("testDetail.editTest")}
            </button>
          )}
        </div>
      )}

      {test && test.questions.length === 0 && (
        <p className="text-lg text-grey">{t("testDetail.noQuestions")}</p>
      )}

      {test && test.questions.length > 0 && (
        <ul className="flex flex-col gap-4">
          {test.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              number={index + 1}
            />
          ))}
        </ul>
      )}

      {isAdmin && isEditing && (
        <TestFormModal testId={testId} onClose={() => setIsEditing(false)} />
      )}
    </div>
  );
}
