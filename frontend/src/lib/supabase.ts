import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Cliente browser tipado con sesión persistente (auth real teléfono+contraseña).
// Se usa la clave anon LEGACY a propósito (supabase-js 2.39.3 predata sb_publishable_).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient<Database>(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
