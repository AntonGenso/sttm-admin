import axios from "axios";
import type { ICity, ISchool } from "../types/classes";

export const getCities = async (): Promise<ICity[]> => {
  const { data } = await axios.get<ICity[]>("/api/cities");
  return data;
};

/** Школы города — список, из которого учитель выбирает свою. */
export const getSchools = async (cityId: number): Promise<ISchool[]> => {
  const { data } = await axios.get<ISchool[]>("/api/schools", {
    params: { cityId },
  });
  return data;
};

/**
 * Школы города, похожие на вводимое название.
 *
 * Спрашивается ровно перед тем, как учитель заведёт новую школу: ключ
 * дедупликации строгий, поэтому «Школа №5» и «Школа №5 им. Навои» — разные
 * строки, и единственный способ их не наплодить — показать учителю, что
 * похожая школа в городе уже есть.
 */
export const getSimilarSchools = async (
  cityId: number,
  name: string,
): Promise<ISchool[]> => {
  const { data } = await axios.get<ISchool[]>("/api/schools/similar", {
    params: { cityId, name },
  });
  return data;
};
