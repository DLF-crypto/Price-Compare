import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@/types';

interface EmployeeState {
  employees: User[];
  load: () => void;
  add: (data: Omit<User, 'id' | 'createdAt'>) => void;
  update: (id: string, data: Partial<User>) => void;
  remove: (id: string) => void;
}

function persist(employees: User[]) {
  localStorage.setItem('users', JSON.stringify(employees));
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],

  load: () => {
    const data: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    set({ employees: data });
  },

  add: (data) => {
    const item: User = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    const updated = [...get().employees, item];
    set({ employees: updated });
    persist(updated);
  },

  update: (id, data) => {
    const updated = get().employees.map((e) => (e.id === id ? { ...e, ...data } : e));
    set({ employees: updated });
    persist(updated);
  },

  remove: (id) => {
    const updated = get().employees.filter((e) => e.id !== id);
    set({ employees: updated });
    persist(updated);
  },
}));
