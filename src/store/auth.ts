import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserResponse } from "@/types/dto";

interface AuthState {
  user: UserResponse | null;
  isHydrated: boolean;
  setUser: (u: UserResponse | null) => void;
  markHydrated: () => void;
  hasRole: (...roles: Array<NonNullable<UserResponse>["userType"]>) => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isHydrated: false,
      setUser: (u) => set({ user: u }),
      markHydrated: () => set({ isHydrated: true }),
      hasRole: (...roles) => {
        const u = get().user;
        if (!u) return false;
        return roles.includes(u.userType);
      },
    }),
    {
      name: "gym-ops-auth",
      partialize: (s) => ({ user: s.user }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
