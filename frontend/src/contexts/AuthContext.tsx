'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, UserRole, UserStatus } from '@/types/database';

interface AuthUser { id: string; alias: string } // compat con RoomContext

export interface RegisterInput {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  cuit: string;
  birth_date: string; // YYYY-MM-DD
  password: string;
}

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
  register: (p: RegisterInput) => Promise<{ error?: string }>;
  login: (p: { email: string; password: string }) => Promise<{ error?: string }>;
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
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      if (data) setProfile(data as Profile);
      return (data as Profile) ?? null;
    } catch {
      return null;
    }
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
    let done = false;
    const finishLoading = () => { if (!done) { done = true; setLoading(false); } };

    // Red de seguridad: nunca quedarse colgado en "Cargando…" pase lo que pase.
    const safety = setTimeout(finishLoading, 4000);

    // onAuthStateChange emite INITIAL_SESSION al instante con la sesión guardada
    // (sin depender de getSession(), que puede colgarse por el navigator lock).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        void fetchProfile(s.user.id);          // en segundo plano, no bloquea
        subscribeProfile(s.user.id);
      } else {
        setProfile(null);
        if (profileChannelRef.current) { supabase.removeChannel(profileChannelRef.current); profileChannelRef.current = null; }
      }
      finishLoading();
    });

    // Respaldo: si por algún motivo no llega INITIAL_SESSION, liberamos igual.
    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(prev => prev ?? data.session);
        if (data.session?.user) void fetchProfile(data.session.user.id);
        finishLoading();
      })
      .catch(finishLoading);

    return () => {
      clearTimeout(safety);
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

  const register = useCallback(async (p: RegisterInput) => {
    // 1) Crear la cuenta (confirmada) en el servidor con la service-role key.
    let res: Response;
    try {
      res = await fetch('/api/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p),
      });
    } catch {
      return { error: 'No se pudo conectar con el servidor.' };
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: (json as { error?: string }).error ?? 'No se pudo crear la cuenta.' };

    // 2) Iniciar sesión con email + contraseña.
    const { error } = await supabase.auth.signInWithPassword({ email: p.email.trim().toLowerCase(), password: p.password });
    if (error) return { error: traducirError(error.message) };
    return {};
  }, []);

  const login = useCallback(async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
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
  if (m.includes('invalid login') || m.includes('credentials')) return 'Email o contraseña incorrectos.';
  if (m.includes('already registered') || m.includes('already exists')) return 'Ese email ya está registrado. Iniciá sesión.';
  if (m.includes('password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('email')) return 'Revisá el email.';
  if (m.includes('not confirmed')) return 'Tu cuenta necesita confirmación. Contactá a un cajero.';
  return 'Ocurrió un error. Probá de nuevo.';
}

export const useAuth = () => useContext(AuthContext);
