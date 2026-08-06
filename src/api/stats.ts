import axios from "axios";

/** Academy-wide counters, admin only. */
export interface IOverviewStats {
  teachers: number;
  students: number;
  missions: number;
  classes: number;
  schools: number;
  /** Active students across all classes. */
  enrollments: number;
  users: number;
}

export const getOverview = async (): Promise<IOverviewStats> => {
  const { data } = await axios.get<IOverviewStats>("/api/stats/overview");
  return data;
};
