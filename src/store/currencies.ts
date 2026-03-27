import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Currency } from '@/types';

interface CurrencyState {
  currencies: Currency[];
  load: () => void;
  add: (data: Omit<Currency, 'id' | 'createdAt'>) => void;
  update: (id: string, data: Partial<Currency>) => void;
  remove: (id: string) => void;
}

function persist(currencies: Currency[]) {
  localStorage.setItem('currencies', JSON.stringify(currencies));
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currencies: [],

  load: () => {
    const data: Currency[] = JSON.parse(localStorage.getItem('currencies') || '[]');
    set({ currencies: data });
  },

  add: (data) => {
    const item: Currency = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    const updated = [...get().currencies, item];
    set({ currencies: updated });
    persist(updated);
  },

  update: (id, data) => {
    const updated = get().currencies.map((c) => (c.id === id ? { ...c, ...data } : c));
    set({ currencies: updated });
    persist(updated);
  },

  remove: (id) => {
    const updated = get().currencies.filter((c) => c.id !== id);
    set({ currencies: updated });
    persist(updated);
  },
}));
