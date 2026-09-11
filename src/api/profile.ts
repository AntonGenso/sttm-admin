import axios from "axios";
import type { AuthUser } from "../store/authStore";

/**
 * Город и школа учителя.
 *
 * Ответ приходит в той же форме, что и у register/login/refresh, поэтому его
 * кладут прямо в `authStore` — второй формы «пользователя» в приложении нет.
 */
export interface ProfilePayload {
  cityId?: number | null;
  schoolId?: number | null;
  /** Название новой школы; учитывается, только когда `schoolId` не прислан. */
  schoolName?: string;
}

export const getMyProfile = async (): Promise<AuthUser> => {
  const { data } = await axios.get<AuthUser>("/api/users/me");
  return data;
};

export const updateMyProfile = async (
  payload: ProfilePayload,
): Promise<AuthUser> => {
  const { data } = await axios.patch<AuthUser>("/api/users/me", payload);
  return data;
};
