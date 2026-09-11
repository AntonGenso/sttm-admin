import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RoleName = "admin" | "teacher" | "student";

export interface AuthUser {
  id: number;
  name: string;
  /** Null for accounts created before the phone became required. */
  phone: string | null;
  roles: RoleName[];
  /**
   * Город и школа учителя. Оба могут быть пустыми — регистрация их не требует,
   * — но без них класс не создать: панель гейтит создание класса именно по этим
   * полям, поэтому они приезжают вместе с сессией, а не отдельным запросом.
   */
  cityId: number | null;
  cityName: string | null;
  schoolId: number | null;
  schoolName: string | null;
}

/** Профиль заполнен настолько, чтобы можно было завести класс. */
export const hasCompleteProfile = (user: AuthUser | null): boolean =>
  Boolean(user?.cityId && user?.schoolId);

interface AuthState {
  token: string | null;
  /** Long-lived token used to mint new access tokens; see api/http.ts. */
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void;
  /** Swaps just the token pair after a silent refresh, keeping the user. */
  setTokens: (token: string, refreshToken: string) => void;
  /** Обновляет пользователя, не трогая токены — после правки профиля. */
  setUser: (user: AuthUser) => void;
  logout: () => void;
  hasRole: (role: RoleName) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, refreshToken, user) =>
        set({ token, refreshToken, user }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
      hasRole: (role) => get().user?.roles?.includes(role) ?? false,
    }),
    { name: "sttm-admin-auth" },
  ),
);
