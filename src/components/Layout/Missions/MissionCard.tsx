import type { IMissionData } from "@/types/missions";

export const MissionCard = (data: IMissionData) => {
  return (
    <div>
      <div className="p-[20px]">
        <div className="flex gap-4">
          <div>
            <img src={data?.picture} />
          </div>
          <div>
            <p>{data.label}</p>
            <span>{data?.xp}</span>
          </div>
        </div>
        <button>Start the lesson</button>
      </div>
    </div>
  );
};
