import axios from "axios";
import type { AuthUser } from "../store/authStore";

const BASE_URL = "/api/auth";

export interface RegisterPayload {
  name: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export const registerUser = async (
  payload: RegisterPayload,
): Promise<AuthResponse> => {
  const { data } = await axios.post<AuthResponse>(
    `${BASE_URL}/register`,
    payload,
  );
  return data;
};

export type LoginPayload = RegisterPayload;

export const loginUser = async (
  payload: LoginPayload,
): Promise<AuthResponse> => {
  const { data } = await axios.post<AuthResponse>(`${BASE_URL}/login`, payload);
  return data;
};
