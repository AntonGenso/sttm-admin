import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";
import { refreshSession } from "./auth";

// Attach the JWT to every outgoing request when the user is authenticated.
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Single-flight refresh: many requests can 401 at once (e.g. a page load firing
 * several calls with the same expired token). They all await the one refresh
 * instead of each rotating the token and invalidating the others.
 */
let refreshing: Promise<string | null> | null = null;

const runRefresh = async (): Promise<string | null> => {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const data = await refreshSession(refreshToken);
    useAuthStore.getState().setTokens(data.token, data.refreshToken);
    return data.token;
  } catch {
    useAuthStore.getState().logout();
    return null;
  }
};

/** Requests to the auth endpoints themselves must never trigger a refresh loop. */
const isAuthCall = (url?: string) => !!url && url.includes("/auth/");

axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const shouldRefresh =
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthCall(original.url);

    if (shouldRefresh) {
      original._retry = true;
      if (!refreshing) {
        refreshing = runRefresh().finally(() => {
          refreshing = null;
        });
      }
      const newToken = await refreshing;
      if (newToken) {
        // The request interceptor re-attaches the (now refreshed) store token.
        return axios(original);
      }
    }

    // Refresh impossible or itself failed: the store is already cleared above.
    return Promise.reject(error);
  },
);
