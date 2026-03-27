import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Supplier, SupplierType } from '@/types';

interface SupplierState {
  suppliers: Supplier[];
  load: () => void;
  add: (data: Omit<Supplier, 'id' | 'createdAt'>) => void;
  update: (id: string, data: Partial<Supplier>) => void;
  remove: (id: string) => void;
}

function persist(suppliers: Supplier[]) {
  localStorage.setItem('suppliers', JSON.stringify(suppliers));
}

function normalize(raw: Record<string, unknown>): Supplier {
  const s = raw as unknown as Supplier & { supplierType?: SupplierType };
  if (Array.isArray(s.supplierTypes)) return s;
  return { ...s, supplierTypes: s.supplierType ? [s.supplierType] : [] };
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],

  load: () => {
    const raw: Record<string, unknown>[] = JSON.parse(localStorage.getItem('suppliers') || '[]');
    const data = raw.map(normalize);
    set({ suppliers: data });
  },

  add: (data) => {
    const item: Supplier = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    const updated = [...get().suppliers, item];
    set({ suppliers: updated });
    persist(updated);
  },

  update: (id, data) => {
    const updated = get().suppliers.map((s) => (s.id === id ? { ...s, ...data } : s));
    set({ suppliers: updated });
    persist(updated);
  },

  remove: (id) => {
    const updated = get().suppliers.filter((s) => s.id !== id);
    set({ suppliers: updated });
    persist(updated);
  },
}));
