import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,

  init: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile && profile.status === 'active') {
          set({ user: profile as User, isLoading: false });
          return;
        }
        // inactive user — sign out
        await supabase.auth.signOut();
      }
    } catch {
      // ignore
    }
    set({ user: null, isLoading: false });
  },

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return '用户信息不存在';
    }

    if (profile.status !== 'active') {
      await supabase.auth.signOut();
      return '账号已停用';
    }

    set({ user: profile as User });
    return null; // success
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  isAdmin: () => get().user?.role === 'ADMIN',
}));
