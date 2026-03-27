import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Country } from '@/types';

interface CountryState {
  countries: Country[];
  load: () => void;
  add: (data: Omit<Country, 'id' | 'createdAt'>) => void;
  update: (id: string, data: Partial<Country>) => void;
  remove: (id: string) => void;
}

function persist(countries: Country[]) {
  localStorage.setItem('countries', JSON.stringify(countries));
}

export const useCountryStore = create<CountryState>((set, get) => ({
  countries: [],

  load: () => {
    const data: Country[] = JSON.parse(localStorage.getItem('countries') || '[]');
    set({ countries: data });
  },

  add: (data) => {
    const item: Country = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    const updated = [...get().countries, item];
    set({ countries: updated });
    persist(updated);
  },

  update: (id, data) => {
    const updated = get().countries.map((c) => (c.id === id ? { ...c, ...data } : c));
    set({ countries: updated });
    persist(updated);
  },

  remove: (id) => {
    const updated = get().countries.filter((c) => c.id !== id);
    set({ countries: updated });
    persist(updated);
  },
}));
