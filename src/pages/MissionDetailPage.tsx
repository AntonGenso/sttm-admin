import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getMission } from "../api/missions";
import { MissionFormModal } from "../components/Missions/MissionFormModal";
import { useAuthStore } from "../store/authStore";
import missionDefaultCover from "../assets/mission-default.svg";
import type { IMissionFile } from "../types/missions";

/** One localized material section rendered as a card with RU/UZ open buttons. */
interface MaterialSection {
  title: string;
  hint: string;
  ru: IMissionFile;
  uz: IMissionFile;
  /** Call to action on each available button; defaults to "Открыть ↗". */
  actionLabel?: string;
}

const LOCALE_LABEL: Record<"ru" | "uz", string> = {
  ru: "Русский",
  uz: "O'zbek",
};

/** A signed link is short-lived, so it is opened, never stored — a new tab. */
const openFile = (file: IMissionFile) => {
  if (file.url) {
    window.open(file.url, "_blank", "noopener,noreferrer");
  }
};

const LocaleButton = ({
  locale,
  file,
  actionLabel = "Открыть ↗",
}: {
  locale: "ru" | "uz";
  file: IMissionFile;
  actionLabel?: string;
}) => {
  const available = Boolean(file.url);

  return (
    <button
      type="button"
      disabled={!available}
      onClick={() => openFile(file)}
      title={file.name ?? undefined}
      className={[
        "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-lg transition-colors",
        available
          ? "cursor-pointer border-cyan-bright/40 text-cyan-bright hover:bg-cyan-bright/10"
          : "cursor-not-allowed border-white/10 text-grey/50",
      ].join(" ")}
    >
      <span className="font-medium">{LOCALE_LABEL[locale]}</span>
      <span className="font-mono text-xs uppercase tracking-widest">
        {available ? actionLabel : "нет файла"}
      </span>
    </button>
  );
};

const MaterialCard = ({ section }: { section: MaterialSection }) => (
  <div className="flex flex-col gap-4 rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] p-6 backdrop-blur-md">
    <div>
      <h3 className="text-2xl font-semibold text-white">{section.title}</h3>
      <p className="mt-1 text-base text-grey">{section.hint}</p>
    </div>
    <div className="mt-auto flex flex-col gap-2">
      <LocaleButton locale="uz" file={section.uz} actionLabel={section.actionLabel} />
      <LocaleButton locale="ru" file={section.ru} actionLabel={section.actionLabel} />
    </div>
  </div>
);

export default function MissionDetailPage() {
  const { id } = useParams();
  const missionId = Number(id);
  const isValidId = Number.isInteger(missionId) && missionId > 0;

  const isAdmin = useAuthStore((state) => state.hasRole("admin"));
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: mission,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["mission", missionId],
    queryFn: () => getMission(missionId),
    enabled: isValidId,
  });

  const isMissing =
    !isValidId ||
    (axios.isAxiosError(error) && error.response?.status === 404);

  if (isMissing) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-5xl font-bold tracking-wide text-white">
          Mission not found
        </h1>
        <p className="text-xl text-grey">It may have been removed.</p>
        <Link
          to="/missions"
          className="rounded-full border border-cyan-bright/40 px-5 py-2 text-lg text-cyan-bright transition-colors hover:bg-cyan-bright/10"
        >
          Back to missions
        </Link>
      </div>
    );
  }

  // Every mission carries the lesson kit; the bonus (student instruction +
  // reward) is shown separately, only when it exists.
  const sections: MaterialSection[] = mission
    ? [
        {
          title: "Презентация",
          hint: "Слайды урока — открываются в новой вкладке",
          ru: mission.teacher_guide.ru,
          uz: mission.teacher_guide.uz,
        },
        {
          title: "Конспект урока",
          hint: "План и материалы урока для учителя",
          ru: mission.lesson_notes.ru,
          uz: mission.lesson_notes.uz,
        },
        {
          title: "Видео миссии",
          hint: "Ролик урока — открывается в новой вкладке",
          ru: mission.video.ru,
          uz: mission.video.uz,
          actionLabel: "Смотреть ↗",
        },
      ]
    : [];

  const hasBonus = Boolean(
    mission &&
      (mission.documents.ru.url ||
        mission.documents.uz.url ||
        (mission.bonus_xp ?? 0) > 0),
  );

  const bonusSection: MaterialSection | null = mission
    ? {
        title: "Инструкция для ученика",
        hint: "Раздаточные материалы для кадетов",
        ru: mission.documents.ru,
        uz: mission.documents.uz,
      }
    : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link
          to="/missions"
          className="w-fit font-mono text-xs tracking-widest text-cyan-bright uppercase transition-opacity hover:opacity-75"
        >
          ← Missions
        </Link>

        {isLoading && <span className="text-lg text-grey">Loading...</span>}

        {error && !isMissing && (
          <p className="text-lg text-error">Could not load the mission</p>
        )}

        {mission && (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[rgba(2,37,51,0.6)]">
                <img
                  src={mission.cover_url ?? missionDefaultCover}
                  alt={mission.label}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-5xl font-bold tracking-wide text-white">
                  {mission.label}
                </h1>
                <div className="flex items-center gap-3">
                  {mission.xp != null && (
                    <span className="font-mono text-sm text-cyan-bright">
                      {mission.xp} XP
                    </span>
                  )}
                  {hasBonus && (
                    <span className="rounded-lg bg-gradient-to-b from-[#4ade80] to-[#22c55e] px-3 py-1 text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_2px_8px_rgba(34,197,94,0.45)]">
                      + Bonus
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
                Edit mission
              </button>
            )}
          </div>
        )}
      </div>

      {mission && (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 laptop:grid-cols-3">
          {sections.map((section) => (
            <MaterialCard key={section.title} section={section} />
          ))}
        </section>
      )}

      {mission && hasBonus && bonusSection && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-semibold text-white">Бонус</h2>
            {(mission.bonus_xp ?? 0) > 0 && (
              <span className="rounded-lg bg-gradient-to-b from-[#4ade80] to-[#22c55e] px-3 py-1 font-mono text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_2px_8px_rgba(34,197,94,0.45)]">
                +{mission.bonus_xp} XP
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 laptop:grid-cols-3">
            <MaterialCard section={bonusSection} />
          </div>
        </section>
      )}

      {isAdmin && isEditing && (
        <MissionFormModal
          missionId={missionId}
          onClose={() => setIsEditing(false)}
        />
      )}
    </div>
  );
}
