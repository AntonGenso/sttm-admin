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
 * Ends the session for good.
 *
 * Every path that decides the session cannot be recovered goes through here,
 * and none of them may leave a token in the store: `PrivatRouter` watches that
 * token, so a stale one means the panel keeps rendering while every request
 * comes back 401 — no redirect, just empty lists and authorization errors.
 */
const endSession = () => {
  if (useAuthStore.getState().token) {
    useAuthStore.getState().logout();
  }
};

/**
 * Single-flight refresh: many requests can 401 at once (e.g. a page load firing
 * several calls with the same expired token). They all await the one refresh
 * instead of each rotating the token and invalidating the others.
 */
let refreshing: Promise<string | null> | null = null;

/**
 * Tells "this session is over" from "the request did not get through".
 *
 * The refresh endpoint answers 401 for a token that is expired, revoked, or
 * replayed — that is the session ending, and the user has to log in again. A
 * timeout, a dropped connection or a 5xx says nothing about the session: it
 * must not log anyone out, or a backend restart would sign out every open
 * panel.
 */
const isSessionOver = (error: unknown) => {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 400 || status === 401 || status === 403;
};

const runRefresh = async (): Promise<string | null> => {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    // Nothing left to refresh with, so the access token can never be renewed.
    endSession();
    return null;
  }

  try {
    const data = await refreshSession(refreshToken);
    useAuthStore.getState().setTokens(data.token, data.refreshToken);
    return data.token;
  } catch (error) {
    if (isSessionOver(error)) {
      endSession();
    }
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

    if (error.response?.status !== 401 || !original || isAuthCall(original.url)) {
      return Promise.reject(error);
    }

    if (original._retry) {
      // The retry carried a token this client had just refreshed and the server
      // still refused it — the session is gone (another tab replayed a stale
      // refresh token, say, and the backend revoked the whole family).
      endSession();
      return Promise.reject(error);
    }

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

    return Promise.reject(error);
  },
);

/**
 * Keeps tabs in step.
 *
 * Refresh tokens rotate: using one revokes it. Each tab holds its own copy in
 * memory, so after one tab refreshes, the others still carry the token that was
 * just spent — and replaying it is what the backend treats as a stolen token,
 * revoking every live token of that user. One background tab waking up could
 * therefore sign the user out of the panel they were working in.
 *
 * `persist` writes each rotation to localStorage, and this picks it up in the
 * other tabs, so they refresh with the current token instead of a spent one.
 */
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "sttm-admin-auth") {
      void useAuthStore.persist.rehydrate();
    }
  });
}
