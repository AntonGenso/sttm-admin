import axios from "axios";

/** Academy-wide counters, admin only. The rows behind them live in `admin.ts`. */
export interface IOverviewStats {
  teachers: number;
  students: number;
  missions: number;
  classes: number;
  schools: number;
  /** Школы, заведённые учителями и ещё не проверенные админом. */
  unverified_schools: number;
  cities: number;
  /** Active students across all classes. */
  enrollments: number;
  users: number;
}

export const getOverview = async (): Promise<IOverviewStats> => {
  const { data } = await axios.get<IOverviewStats>("/api/stats/overview");
  return data;
};
