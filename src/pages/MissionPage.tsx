import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMissions, createMission } from "../api/missions";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { MissionCard } from "../components/Layout/Missions/MissionCard";
import type { IMissionData } from "../types/missions";

type Inputs = {
  missionName: string;
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
      <div>
        <h1>Mission Page</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer rounded-[8px] bg-blue-500 p-[8px_12px]"
        >
          Create
        </button>
        {isLoading && <span>Loading...</span>}
        {data && (
          <ul className="grid grid-cols-4">
            {data.map((item: IMissionData) => (
              <li key={item.id}>
                {item?.name}
                <MissionCard data={item} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && (
        <div className="absolute top-0 flex h-full w-full items-center justify-center bg-black/40 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full max-w-[500px] flex-col gap-4 rounded-[8px] bg-white p-4"
          >
            <label className="flex flex-col gap-2 text-black">
              Mission Name
              <input
                className="rounded-[4px] border-[1px] border-gray-300 p-[4px] outline-none focus:border-blue-400 active:border-blue-400"
                {...register("missionName", { required: true })}
              />
            </label>
            {errors.missionName && (
              <span className="text-red-400">This field is required</span>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="w-fit cursor-pointer rounded-[6px] bg-blue-500 p-[8px_16px] font-semibold"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-fit cursor-pointer rounded-[6px] bg-red-500 p-[8px_16px] font-semibold"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
