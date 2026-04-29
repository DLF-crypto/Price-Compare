import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import type { Currency } from '@/types';

interface CurrencyState {
  currencies: Currency[];
  load: () => Promise<void>;
  add: (data: Omit<Currency, 'id' | 'createdAt'>) => Promise<void>;
  update: (id: string, data: Partial<Currency>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currencies: [],

  load: async () => {
    const { data } = await supabase
      .from('currencies')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ currencies: (data ?? []) as Currency[] });
  },

  add: async (data) => {
    const item = { ...data, id: uuidv4() };
    await supabase.from('currencies').insert(item);
    const { data: all } = await supabase
      .from('currencies')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ currencies: (all ?? []) as Currency[] });
  },

  update: async (id, data) => {
    await supabase.from('currencies').update(data).eq('id', id);
    const { data: all } = await supabase
      .from('currencies')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ currencies: (all ?? []) as Currency[] });
  },

  remove: async (id) => {
    await supabase.from('currencies').delete().eq('id', id);
    const { data } = await supabase
      .from('currencies')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ currencies: (data ?? []) as Currency[] });
  },
}));
