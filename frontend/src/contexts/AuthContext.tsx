'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toE164 } from '@/lib/format';
import type { Profile, UserRole, UserStatus } from '@/types/database';

interface AuthUser { id: string; alias: string } // compat con RoomContext

interface AuthContextType {
  loading: boolean;
  session: Session | null;
  user: AuthUser | null;
  profile: Profile | null;
  role: UserRole | null;
  status: UserStatus | null;
  isAdmin: boolean;
  isCashier: boolean;
  isActive: boolean;
  isPending: boolean;
  register: (p: { alias: string; phone: string; password: string }) => Promise<{ error?: string }>;
  login: (p: { phone: string; password: string }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  loading: true, session: null, user: null, profile: null, role: null, status: null,
  isAdmin: false, isCashier: false, isActive: false, isPending: false,
  register: async () => ({}), login: async () => ({}), logout: async () => {}, refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const profileChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) setProfile(data as Profile);
    return data as Profile | null;
  }, []);

  // Suscripción Realtime a la propia fila de profiles (balance/estado en vivo).
  const subscribeProfile = useCallback((uid: string) => {
    if (profileChannelRef.current) supabase.removeChannel(profileChannelRef.current);
    const ch = supabase
      .channel(`profile-${uid}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` },
        (payload) => setProfile(payload.new as Profile))
      .subscribe();
    profileChannelRef.current = ch;
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        await fetchProfile(data.session.user.id);
        subscribeProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user) {
        await fetchProfile(s.user.id);
        subscribeProfile(s.user.id);
      } else {
        setProfile(null);
        if (profileChannelRef.current) { supabase.removeChannel(profileChannelRef.current); profileChannelRef.current = null; }
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      if (profileChannelRef.current) supabase.removeChannel(profileChannelRef.current);
    };
  }, [fetchProfile, subscribeProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      // refresca también el JWT para traer el claim de rol actualizado
      await supabase.auth.refreshSession();
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  const register = useCallback(async ({ alias, phone, password }: { alias: string; phone: string; password: string }) => {
    const e164 = toE164(phone);
    const { data, error } = await supabase.auth.signUp({
      phone: e164, password, options: { data: { alias: alias.trim() } },
    });
    if (error) return { error: traducirError(error.message) };
    // Con "Confirm phone" desactivado ya hay sesión; si no, intentamos login directo.
    if (!data.session) {
      const { error: e2 } = await supabase.auth.signInWithPassword({ phone: e164, password });
      if (e2) return { error: traducirError(e2.message) };
    }
    return {};
  }, []);

  const login = useCallback(async ({ phone, password }: { phone: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ phone: toE164(phone), password });
    if (error) return { error: traducirError(error.message) };
    return {};
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const role = profile?.role ?? null;
  const status = profile?.status ?? null;
  const user: AuthUser | null = profile ? { id: profile.id, alias: profile.alias } : null;

  return (
    <AuthContext.Provider value={{
      loading, session, user, profile, role, status,
      isAdmin: role === 'admin',
      isCashier: role === 'cashier',
      isActive: status === 'active',
      isPending: status === 'pending',
      register, login, logout, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

function traducirError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('credentials')) return 'Teléfono o contraseña incorrectos.';
  if (m.includes('already registered') || m.includes('already exists')) return 'Ese teléfono ya está registrado. Iniciá sesión.';
  if (m.includes('password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('phone')) return 'Revisá el número de teléfono.';
  if (m.includes('not confirmed')) return 'Tu cuenta necesita confirmación. Contactá a un cajero.';
  return 'Ocurrió un error. Probá de nuevo.';
}

export const useAuth = () => useContext(AuthContext);
