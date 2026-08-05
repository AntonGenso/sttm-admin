import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RoleName = "admin" | "teacher" | "student";

export interface AuthUser {
  id: number;
  name: string;
  /** Null for accounts created before the phone became required. */
  phone: string | null;
  roles: RoleName[];
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  hasRole: (role: RoleName) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      hasRole: (role) => get().user?.roles?.includes(role) ?? false,
    }),
    { name: "sttm-admin-auth" },
  ),
);
