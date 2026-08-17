import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { IMissionData } from "@/types/missions";
import missionDefaultCover from "@/assets/mission-default.svg";

interface Props {
  data: IMissionData;
  /** Edit and delete are rendered for admins only. */
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export const MissionCard = ({ data, onEdit, onDelete, isDeleting }: Props) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const navigate = useNavigate();

  const openMission = () => navigate(`/missions/${data.id}`);

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
      className="flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] backdrop-blur-md transition-colors hover:border-cyan-bright/60"
    >
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[rgba(2,37,51,0.6)]">
            <img
              src={data.cover_url ?? data.picture ?? missionDefaultCover}
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
          Start the lesson
        </button>

        {(onEdit || onDelete) &&
          (isConfirmingDelete ? (
            <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
              <span className="text-base text-grey">
                Delete the mission with all its files?
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
                  Cancel
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
                  {isDeleting ? "Deleting..." : "Delete"}
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
                  Edit
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
                  Delete
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};
