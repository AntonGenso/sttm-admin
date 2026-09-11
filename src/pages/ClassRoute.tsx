import { useAuthStore } from "../store/authStore";
import AdminClassPage from "./AdminClassPage";
import ClassPage from "./ClassPage";

/**
 * `/classes/:id` means two different things depending on who is asking.
 *
 * A teacher opens their own class — the roster, the leaderboard, the invite
 * code they can re-issue — through the teacher-scoped API, which answers 404
 * for anyone else's class. An admin browsing the directory needs any class in
 * the academy, which only the admin API can serve, so the same URL resolves to
 * the admin view for them.
 */
export default function ClassRoute() {
  const isAdmin = useAuthStore((state) => state.hasRole("admin"));
  return isAdmin ? <AdminClassPage /> : <ClassPage />;
}
