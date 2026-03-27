import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('currentUser') || 'null'),

  login: (email: string, password: string) => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(
      (u) => u.email === email && u.password === password && u.status === 'active'
    );
    if (found) {
      set({ user: found });
      localStorage.setItem('currentUser', JSON.stringify(found));
      return true;
    }
    return false;
  },

  logout: () => {
    set({ user: null });
    localStorage.removeItem('currentUser');
  },

  isAdmin: () => get().user?.role === 'ADMIN',
}));
