import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  authReady: boolean;
  setUser: (user: User | null) => void;
  setAuthReady: (ready: boolean) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      authReady: false,
      setUser: (user) => set({ user }),
      setAuthReady: (ready) => set({ authReady: ready }),
      isAuthenticated: () => get().user !== null,
    }),
    {
      name: 'auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
