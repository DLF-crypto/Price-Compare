import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface EmployeeState {
  employees: User[];
  load: () => Promise<void>;
  add: (data: { name: string; email: string; password: string; role: 'ADMIN' | 'USER'; status: 'active' | 'inactive' }) => Promise<string | null>;
  update: (id: string, data: Partial<Pick<User, 'name' | 'role' | 'status'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  employees: [],

  load: async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ employees: (data ?? []) as User[] });
  },

  add: async ({ name, email, password, role, status }) => {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) return authError.message;
    if (!authData.user) return '创建用户失败';

    // 2. Insert profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      name,
      email,
      role,
      status,
    });
    if (profileError) return profileError.message;

    // 3. Reload
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ employees: (data ?? []) as User[] });
    return null;
  },

  update: async (id, data) => {
    await supabase.from('profiles').update(data).eq('id', id);
    const { data: all } = await supabase
      .from('profiles')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ employees: (all ?? []) as User[] });
  },

  remove: async (id) => {
    await supabase.from('profiles').delete().eq('id', id);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('createdAt', { ascending: false });
    set({ employees: (data ?? []) as User[] });
  },
}));
