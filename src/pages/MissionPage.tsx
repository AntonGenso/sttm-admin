import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMissions, createMission } from "../api/missions";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { MissionCard } from "../components/Missions/MissionCard";
import type { IMissionData } from "../types/missions";

type Inputs = {
  missionName: string;
  attachment: FileList;
};

export default function MissionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<Inputs>();

  const fileList = watch("attachment");
  const fileName = fileList?.[0]?.name;

  const { data, error, isLoading } = useQuery({
    queryKey: ["missions"],
    queryFn: getMissions,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["missions"] });
      setIsModalOpen(false);
      reset();
    },
  });

  const onSubmit: SubmitHandler<Inputs> = (data) => mutate(data.missionName);

  return (
    <div className="h-full w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold tracking-wide text-white">
            Missions
          </h1>
          <p className="mt-1 text-xl text-grey">
            Create and manage academy missions
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-6 py-2.5 text-lg font-bold text-white transition-opacity hover:opacity-85"
        >
          + Create mission
        </button>
      </div>

      {isLoading && <span className="text-lg text-grey">Loading...</span>}

      {data && (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 laptop:grid-cols-4">
          {data.map((item: IMissionData) => (
            <li key={item.id}>
              <MissionCard data={item} />
            </li>
          ))}
        </ul>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full max-w-[480px] flex-col gap-5 rounded-2xl border border-cyan-bright/40 bg-[rgba(7,21,42,0.9)] p-7 backdrop-blur-xl"
          >
            <h2 className="text-3xl font-bold text-white">New mission</h2>

            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase tracking-widest text-cyan-bright">
                Mission name
              </span>
              <input
                placeholder="e.g. First orbit"
                className="w-full rounded-lg border border-cyan-bright/35 bg-[rgba(2,37,51,0.6)] px-4 py-3 text-lg text-white outline-none transition-colors placeholder:text-grey/50 focus:border-cyan-bright"
                {...register("missionName", { required: true })}
              />
              {errors.missionName && (
                <span className="text-sm text-error">
                  This field is required
                </span>
              )}
            </label>

            <div className="flex items-center gap-3">
              <label
                htmlFor="attachment"
                className="w-fit cursor-pointer rounded-full border border-cyan-bright/40 px-4 py-2 text-base text-cyan-bright transition-colors hover:bg-cyan-bright/10"
              >
                Upload file
              </label>
              <span className="text-base text-grey">
                {fileName || "No file selected"}
              </span>
            </div>
            <input
              id="attachment"
              type="file"
              {...register("attachment")}
              className="hidden"
            />

            <div className="mt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-white/20 px-5 py-2 text-lg text-grey transition-colors hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-gradient-to-br from-cyan-bright to-[#00b8a9] px-6 py-2 text-lg font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {isPending ? "Adding..." : "Add mission"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
