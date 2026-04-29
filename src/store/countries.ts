import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import type { Country } from '@/types';

interface CountryState {
  countries: Country[];
  load: () => Promise<void>;
  add: (data: Omit<Country, 'id' | 'createdAt'>) => Promise<void>;
  update: (id: string, data: Partial<Country>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useCountryStore = create<CountryState>((set) => ({
  countries: [],

  load: async () => {
    const { data } = await supabase
      .from('countries')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ countries: (data ?? []) as Country[] });
  },

  add: async (data) => {
    const item = { ...data, id: uuidv4() };
    await supabase.from('countries').insert(item);
    const { data: all } = await supabase
      .from('countries')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ countries: (all ?? []) as Country[] });
  },

  update: async (id, data) => {
    await supabase.from('countries').update(data).eq('id', id);
    const { data: all } = await supabase
      .from('countries')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ countries: (all ?? []) as Country[] });
  },

  remove: async (id) => {
    await supabase.from('countries').delete().eq('id', id);
    const { data } = await supabase
      .from('countries')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ countries: (data ?? []) as Country[] });
  },
}));
