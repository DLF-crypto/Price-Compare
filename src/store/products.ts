import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Product } from '@/types';

interface ProductState {
  products: Product[];
  load: () => void;
  add: (data: Omit<Product, 'id' | 'createdAt'>) => void;
  update: (id: string, data: Partial<Product>) => void;
  remove: (id: string) => void;
  batchImport: (products: Product[]) => void;
}

function persist(products: Product[]) {
  localStorage.setItem('products', JSON.stringify(products));
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],

  load: () => {
    const data: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
    // Migrate: move top-level handlingFee into each weightRange
    let migrated = false;
    for (const p of data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pa = p as any;
      if (pa.handlingFee !== undefined) {
        const hf = pa.handlingFee;
        if (p.weightRanges) {
          for (const r of p.weightRanges) {
            if (r.handlingFee === undefined) r.handlingFee = hf;
          }
        }
        delete pa.handlingFee;
        migrated = true;
      }
      if (p.lastMile && (p.lastMile as any).handlingFee !== undefined) {
        const lmHf = (p.lastMile as any).handlingFee;
        for (const r of p.lastMile.weightRanges) {
          if (r.handlingFee === undefined) r.handlingFee = lmHf;
        }
        delete (p.lastMile as any).handlingFee;
        migrated = true;
      }
    }
    if (migrated) persist(data);
    set({ products: data });
  },

  add: (data) => {
    const item: Product = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    const updated = [...get().products, item];
    set({ products: updated });
    persist(updated);
  },

  update: (id, data) => {
    const updated = get().products.map((p) => (p.id === id ? { ...p, ...data } : p));
    set({ products: updated });
    persist(updated);
  },

  remove: (id) => {
    const updated = get().products.filter((p) => p.id !== id);
    set({ products: updated });
    persist(updated);
  },

  batchImport: (newProducts) => {
    const updated = [...get().products, ...newProducts];
    set({ products: updated });
    persist(updated);
  },
}));
