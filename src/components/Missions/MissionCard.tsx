import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { IMissionData } from "@/types/missions";
import missionDefaultCover from "@/assets/mission-default.svg";
import { toAssetUrl } from "@/utils/assetUrl";

interface Props {
  data: IMissionData;
  /** Edit, delete and the visibility toggle are rendered for admins only. */
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  /** Flip the mission between visible and hidden; admin-only. */
  onToggleActive?: () => void;
  isTogglingActive?: boolean;
}

export const MissionCard = ({
  data,
  onEdit,
  onDelete,
  isDeleting,
  onToggleActive,
  isTogglingActive,
}: Props) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const openMission = () => navigate(`/missions/${data.id}`);

  // Undefined (legacy rows) counts as visible; only an explicit 0 hides it.
  const isActive = data.is_active !== 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openMission}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openMission();
        }
      }}
      className={`relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-[rgba(5,20,30,0.7)] backdrop-blur-md transition-colors ${
        isActive
          ? "border-cyan-bright/25 hover:border-cyan-bright/60"
          : "border-dashed border-grey/30 hover:border-grey/50"
      }`}
    >
      {onToggleActive && (
        <button
          type="button"
          aria-pressed={isActive}
          title={isActive ? t("missions.visibleHint") : t("missions.hiddenHint")}
          disabled={isTogglingActive}
          onClick={(event) => {
            event.stopPropagation();
            onToggleActive();
          }}
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-colors disabled:opacity-50 ${
            isActive
              ? "border-cyan-bright/40 bg-[rgba(2,37,51,0.7)] text-cyan-bright hover:border-cyan-bright"
              : "border-grey/40 bg-[rgba(5,20,30,0.85)] text-grey hover:text-white"
          }`}
        >
          {isActive ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M6.6 6.6A18.4 18.4 0 0 0 2 12s3.5 7 10 7a9.1 9.1 0 0 0 3.9-.87" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
              <path d="m2 2 20 20" />
            </svg>
          )}
        </button>
      )}

      {!isActive && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 font-mono text-xs uppercase tracking-widest text-grey backdrop-blur-md">
          {t("missions.hidden")}
        </span>
      )}

      <div
        className={`flex flex-1 flex-col gap-4 p-5 transition-opacity ${
          isActive ? "" : "opacity-45 grayscale"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[rgba(2,37,51,0.6)]">
            <img
              src={toAssetUrl(data.cover_url) || data.picture || missionDefaultCover}
              alt={data.label}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-2xl font-semibold text-white">
              {data.label}
            </p>
            {data?.xp != null && (
              <span className="font-mono text-sm text-cyan-bright">
                {data.xp} XP
              </span>
            )}
          </div>
        </div>

        <button className="mt-auto w-full rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] py-2 text-lg font-bold text-white transition-opacity hover:opacity-85">
          {t("missions.start")}
        </button>

        {(onEdit || onDelete) &&
          (isConfirmingDelete ? (
            <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
              <span className="text-base text-grey">
                {t("missions.deleteConfirm")}
              </span>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsConfirmingDelete(false);
                  }}
                  className="text-base text-grey transition-colors hover:text-white"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete?.();
                  }}
                  disabled={isDeleting}
                  className="rounded-full bg-orange-bright/90 px-4 py-1.5 text-base font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                >
                  {isDeleting ? t("common.deleting") : t("common.delete")}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-4 border-t border-white/10 pt-3">
              {onEdit && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit();
                  }}
                  className="text-base text-cyan-bright transition-opacity hover:opacity-75"
                >
                  {t("common.edit")}
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setIsConfirmingDelete(true);
                  }}
                  className="text-base text-orange-bright transition-opacity hover:opacity-75"
                >
                  {t("common.delete")}
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
