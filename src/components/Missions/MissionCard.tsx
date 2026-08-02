import type { IMissionData } from "@/types/missions";

export const MissionCard = ({ data }: { data: IMissionData }) => {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] backdrop-blur-md transition-colors hover:border-cyan-bright/60">
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[rgba(2,37,51,0.6)]">
            {data?.picture ? (
              <img
                src={data.picture}
                alt={data.label}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl">🚀</span>
            )}
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
      </div>
    </div>
  );
};
