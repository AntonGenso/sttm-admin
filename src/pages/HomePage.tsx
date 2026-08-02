import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function HomePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-5xl font-bold tracking-wide text-white">
          Welcome{user ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-2 text-xl text-grey">
          Mission control for Step to the Moon
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Link
          to="/missions"
          className="group rounded-2xl border border-cyan-bright/25 bg-[rgba(5,20,30,0.7)] p-6 backdrop-blur-md transition-colors hover:border-cyan-bright/60"
        >
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-bright">
            Manage
          </span>
          <h2 className="mt-2 text-3xl font-semibold text-white">Missions</h2>
          <p className="mt-1 text-lg text-grey">
            Create and edit missions for cadets
          </p>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-[rgba(5,20,30,0.5)] p-6 backdrop-blur-md">
          <span className="font-mono text-xs uppercase tracking-widest text-orange-bright">
            Coming soon
          </span>
          <h2 className="mt-2 text-3xl font-semibold text-white">Users</h2>
          <p className="mt-1 text-lg text-grey">
            Review and manage registered cadets
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[rgba(5,20,30,0.5)] p-6 backdrop-blur-md">
          <span className="font-mono text-xs uppercase tracking-widest text-orange-bright">
            Coming soon
          </span>
          <h2 className="mt-2 text-3xl font-semibold text-white">Analytics</h2>
          <p className="mt-1 text-lg text-grey">
            Track progress across the academy
          </p>
        </div>
      </div>
    </div>
  );
}
