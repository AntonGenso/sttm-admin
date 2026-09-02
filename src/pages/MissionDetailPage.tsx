import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { getMission } from "../api/missions";
import { MissionFormModal } from "../components/Missions/MissionFormModal";
import { useAuthStore } from "../store/authStore";
import missionDefaultCover from "../assets/mission-default.svg";
import type { IMissionFile } from "../types/missions";
import { toAssetUrl } from "@/utils/assetUrl";
import { formatOpensAt, isUpcoming } from "@/utils/date";

/** One localized material section rendered as a card with RU/UZ open buttons. */
interface MaterialSection {
  title: string;
  hint: string;
  ru: IMissionFile;
  uz: IMissionFile;
  /** i18n key for the call to action; defaults to "open". */
  actionKey?: string;
}

/** A signed link is short-lived, so it is opened, never stored — a new tab. */
const openFile = (file: IMissionFile) => {
  if (file.url) {
    // Адрес MinIO знает только бэкенд: с MINIO_BROWSER_PREFIX он уже отдаёт
    // ссылку через прокси (`/uploads/...`), без него — абсолютную.
    window.open(file.url, "_blank", "noopener,noreferrer");
  }
};

const LocaleButton = ({
  locale,
  file,
  actionKey = "missionDetail.open",
}: {
  locale: "ru" | "uz";
  file: IMissionFile;
  actionKey?: string;
}) => {
  const { t } = useTranslation();
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
      <span className="font-medium">
        {locale === "ru" ? t("missionDetail.localeRu") : t("missionDetail.localeUz")}
      </span>
      <span className="font-mono text-xs tracking-widest uppercase">
        {available ? t(actionKey) : t("missionDetail.noFile")}
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
      <LocaleButton locale="uz" file={section.uz} actionKey={section.actionKey} />
      <LocaleButton locale="ru" file={section.ru} actionKey={section.actionKey} />
    </div>
  </div>
);

export default function MissionDetailPage() {
  const { t } = useTranslation();
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
    !isValidId || (axios.isAxiosError(error) && error.response?.status === 404);

  if (isMissing) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-5xl font-bold tracking-wide text-white">
          {t("missionDetail.notFound")}
        </h1>
        <p className="text-xl text-grey">{t("missionDetail.notFoundDesc")}</p>
        <Link
          to="/missions"
          className="rounded-full border border-cyan-bright/40 px-5 py-2 text-lg text-cyan-bright transition-colors hover:bg-cyan-bright/10"
        >
          {t("missionDetail.backToMissions")}
        </Link>
      </div>
    );
  }

  // Every mission carries the lesson kit; the bonus (student instruction +
  // reward) is shown separately, only when it exists.
  const sections: MaterialSection[] = mission
    ? [
        {
          title: t("missionDetail.presentationTitle"),
          hint: t("missionDetail.presentationHint"),
          ru: mission.teacher_guide.ru,
          uz: mission.teacher_guide.uz,
        },
        {
          title: t("missionDetail.notesTitle"),
          hint: t("missionDetail.notesHint"),
          ru: mission.lesson_notes.ru,
          uz: mission.lesson_notes.uz,
        },
        {
          title: t("missionDetail.videoTitle"),
          hint: t("missionDetail.videoHint"),
          ru: mission.video.ru,
          uz: mission.video.uz,
          actionKey: "missionDetail.watch",
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
        title: t("missionDetail.instructionTitle"),
        hint: t("missionDetail.instructionHint"),
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
          {t("missionDetail.missionsBack")}
        </Link>

        {isLoading && <span className="text-lg text-grey">{t("common.loading")}</span>}

        {error && !isMissing && (
          <p className="text-lg text-error">{t("missionDetail.loadError")}</p>
        )}

        {mission && (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[rgba(2,37,51,0.6)]">
                <img
                  src={toAssetUrl(mission.cover_url) || missionDefaultCover}
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
                    <span className="rounded-lg bg-gradient-to-b from-[#4ade80] to-[#22c55e] px-3 py-1 text-sm font-extrabold tracking-wider text-white uppercase shadow-[0_2px_8px_rgba(34,197,94,0.45)]">
                      {t("missionDetail.plusBonus")}
                    </span>
                  )}
                  {/* Opening date in Tashkent time; amber while it is ahead. */}
                  {mission.opens_at && (
                    <span
                      className={`rounded-lg border px-3 py-1 font-mono text-sm tracking-wide ${
                        isUpcoming(mission.opens_at)
                          ? "border-orange-bright/40 bg-orange-bright/10 text-orange-bright"
                          : "border-white/10 bg-white/[0.03] text-grey"
                      }`}
                    >
                      {isUpcoming(mission.opens_at)
                        ? t("missions.opensAt", {
                            date: formatOpensAt(mission.opens_at),
                          })
                        : t("missions.openedSince", {
                            date: formatOpensAt(mission.opens_at),
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
                {t("missionDetail.editMission")}
              </button>
            )}
          </div>
        )}
      </div>

      {mission && (
        <section className="laptop:grid-cols-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {sections.map((section) => (
            <MaterialCard key={section.title} section={section} />
          ))}
        </section>
      )}

      {mission && hasBonus && bonusSection && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-semibold text-white">{t("missionDetail.bonus")}</h2>
            {(mission.bonus_xp ?? 0) > 0 && (
              <span className="rounded-lg bg-gradient-to-b from-[#4ade80] to-[#22c55e] px-3 py-1 font-mono text-sm font-extrabold tracking-wider text-white uppercase shadow-[0_2px_8px_rgba(34,197,94,0.45)]">
                +{mission.bonus_xp} XP
              </span>
            )}
          </div>
          <div className="laptop:grid-cols-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
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
