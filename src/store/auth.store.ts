import { create } from "zustand";
import { persist } from "zustand/middleware";
import { saveToken, removeToken, getTokenSync } from "@/lib/token";

export interface AuthUser {
  id: string;
  phone: string;
  name: string | null;
  role: string;
  roles: string[];
  is_new_user?: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  activeRole: string | null;
  setAuth: (token: string, user: AuthUser) => void;
  setActiveRole: (role: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      activeRole: null,
      setAuth: (token, user) => {
        // Save to persistent storage (Capacitor Preferences on native, localStorage on web)
        saveToken(token);
        const roles = user.roles ?? [user.role];
        const currentActive = get().activeRole;
        const activeRole =
          currentActive ?? (roles.length === 1 ? roles[0] : null);
        set({ token, user: { ...user, roles }, activeRole });
      },
      setActiveRole: (role) => set({ activeRole: role }),
      clearAuth: () => {
        removeToken();
        set({ token: null, user: null, activeRole: null });
      },
      isAuthenticated: () => {
        // Check both Zustand state and persistent storage
        return !!(get().token ?? getTokenSync());
      },
      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        return (user.roles ?? [user.role]).includes(role);
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        activeRole: state.activeRole,
      }),
    },
  ),
);
