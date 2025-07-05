// store/user.ts
import { create } from 'zustand';
import { UserStore, User } from '@/types';

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user: User | null) => {
    set({ user, isLoading: false });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  logout: () => {
    set({ user: null, isLoading: false });
  },
}));