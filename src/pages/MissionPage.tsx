import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { deleteMission, getMissions } from "../api/missions";
import { useState } from "react";
import { MissionCard } from "../components/Missions/MissionCard";
import { MissionFormModal } from "../components/Missions/MissionFormModal";
import type { IMissionData } from "../types/missions";
import { useAuthStore } from "../store/authStore";

/** `undefined` — closed, `null` — creating, a number — editing that mission. */
type ModalState = undefined | null | number;

export default function MissionPage() {
  const [modal, setModal] = useState<ModalState>(undefined);

  // Teachers get the read-only list; only admins may change missions. Hiding
  // the controls is UX — the endpoints enforce the same rule server-side.
  const isAdmin = useAuthStore((state) => state.hasRole("admin"));

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["missions"],
    queryFn: getMissions,
  });

  const {
    mutate: removeMission,
    isPending: isDeleting,
    variables: deletingId,
    error: deleteError,
  } = useMutation({
    mutationFn: deleteMission,
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      queryClient.removeQueries({ queryKey: ["mission", id] });
    },
  });

  const deleteErrorMessage = axios.isAxiosError(deleteError)
    ? ((deleteError.response?.data as { message?: string } | undefined)
        ?.message ?? "Could not delete the mission")
    : deleteError
      ? "Could not delete the mission"
      : null;

  return (
    <div className="h-full w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold tracking-wide text-white">
            Missions
          </h1>
          <p className="mt-1 text-xl text-grey">
            {isAdmin
              ? "Create and manage academy missions"
              : "Academy missions available to your cadets"}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setModal(null)}
            className="rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-6 py-2.5 text-lg font-bold text-white transition-opacity hover:opacity-85"
          >
            + Create mission
          </button>
        )}
      </div>

      {isLoading && <span className="text-lg text-grey">Loading...</span>}

      {deleteErrorMessage && (
        <p className="mb-4 text-lg text-error">{deleteErrorMessage}</p>
      )}

      {data && (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 laptop:grid-cols-4">
          {data.map((item: IMissionData) => (
            <li key={item.id}>
              <MissionCard
                data={item}
                onEdit={isAdmin ? () => setModal(item.id) : undefined}
                onDelete={isAdmin ? () => removeMission(item.id) : undefined}
                isDeleting={isDeleting && deletingId === item.id}
              />
            </li>
          ))}
        </ul>
      )}

      {isAdmin && modal !== undefined && (
        <MissionFormModal
          missionId={modal ?? undefined}
          onClose={() => setModal(undefined)}
        />
      )}
    </div>
  );
}
