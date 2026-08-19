import axios from "axios";
import type { AuthUser } from "../store/authStore";

const BASE_URL = "/api/auth";

export interface LoginPayload {
  name: string;
  password: string;
}

/** Registration additionally requires a phone number; logging in does not. */
export interface RegisterPayload extends LoginPayload {
  phone: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export interface RefreshResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

/** Rotates the refresh token and returns a new access token + user (fresh roles). */
export const refreshSession = async (
  refreshToken: string,
): Promise<RefreshResponse> => {
  const { data } = await axios.post<RefreshResponse>(`${BASE_URL}/refresh`, {
    refreshToken,
  });
  return data;
};

/** Best-effort server-side revoke of the refresh token on logout. */
export const logoutUser = async (refreshToken: string): Promise<void> => {
  await axios.post(`${BASE_URL}/logout`, { refreshToken });
};

export const registerUser = async (
  payload: RegisterPayload,
): Promise<AuthResponse> => {
  const { data } = await axios.post<AuthResponse>(
    `${BASE_URL}/register`,
    payload,
  );
  return data;
};

export const loginUser = async (
  payload: LoginPayload,
): Promise<AuthResponse> => {
  const { data } = await axios.post<AuthResponse>(`${BASE_URL}/login`, payload);
  return data;
};
