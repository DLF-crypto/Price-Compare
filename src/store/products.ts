import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';

interface ProductState {
  products: Product[];
  load: () => Promise<void>;
  add: (data: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  update: (id: string, data: Partial<Product>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  batchImport: (products: Product[]) => Promise<void>;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],

  load: async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ products: (data ?? []) as Product[] });
  },

  add: async (data) => {
    const item = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    await supabase.from('products').insert(item);
    const { data: all } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ products: (all ?? []) as Product[] });
  },

  update: async (id, data) => {
    await supabase.from('products').update(data).eq('id', id);
    const { data: all } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ products: (all ?? []) as Product[] });
  },

  remove: async (id) => {
    await supabase.from('products').delete().eq('id', id);
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ products: (data ?? []) as Product[] });
  },

  batchImport: async (newProducts) => {
    if (newProducts.length > 0) {
      await supabase.from('products').insert(newProducts);
    }
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ products: (data ?? []) as Product[] });
  },
}));
