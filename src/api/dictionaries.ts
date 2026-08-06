import axios from "axios";
import type { ICity, ISchool } from "../types/classes";

export const getCities = async (): Promise<ICity[]> => {
  const { data } = await axios.get<ICity[]>("/api/cities");
  return data;
};

/** Schools already registered in the city — suggestions for the school field. */
export const getSchools = async (cityId: number): Promise<ISchool[]> => {
  const { data } = await axios.get<ISchool[]>("/api/schools", {
    params: { cityId },
  });
  return data;
};
