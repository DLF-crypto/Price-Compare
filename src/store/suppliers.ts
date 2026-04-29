import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import type { Supplier } from '@/types';

interface SupplierState {
  suppliers: Supplier[];
  load: () => Promise<void>;
  add: (data: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>;
  update: (id: string, data: Partial<Supplier>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useSupplierStore = create<SupplierState>((set) => ({
  suppliers: [],

  load: async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ suppliers: (data ?? []) as Supplier[] });
  },

  add: async (data) => {
    const item = { ...data, id: uuidv4() };
    await supabase.from('suppliers').insert(item);
    const { data: all } = await supabase
      .from('suppliers')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ suppliers: (all ?? []) as Supplier[] });
  },

  update: async (id, data) => {
    await supabase.from('suppliers').update(data).eq('id', id);
    const { data: all } = await supabase
      .from('suppliers')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ suppliers: (all ?? []) as Supplier[] });
  },

  remove: async (id) => {
    await supabase.from('suppliers').delete().eq('id', id);
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ suppliers: (data ?? []) as Supplier[] });
  },
}));
