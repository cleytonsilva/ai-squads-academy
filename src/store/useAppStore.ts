import { create } from "zustand";

export type UserProfile = {
  name?: string;
  email?: string;
};

export type GamificationState = {
  xp: number;
  level: number;
  user?: UserProfile | null;
  addXP: (amount: number) => void;
  setUser: (user: UserProfile | null) => void;
  reset: () => void;
};

const levelFromXP = (xp: number) => Math.floor(1 + Math.sqrt(xp / 100));

export const useAppStore = create<GamificationState>((set) => ({
  xp: 0,
  level: 1,
  user: null,
  addXP: (amount) =>
    set((s) => {
      const newXP = Math.max(0, s.xp + amount);
      return { xp: newXP, level: levelFromXP(newXP) };
    }),
  setUser: (user) => set({ user }),
  reset: () => set({ xp: 0, level: 1, user: null }),
}));
