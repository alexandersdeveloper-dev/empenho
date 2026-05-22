import { create } from 'zustand';
import { supabase } from './supabaseClient';
import type { Perfil } from '@ficha-empenho/shared';

type AuthState = {
  user: (Perfil & { email: string }) | null;
  isLoading: boolean;
  setUser: (user: (Perfil & { email: string }) | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
