'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/types/database';

interface UseNotifications {
  items: Notification[];
  unread: number;
  markAllRead: () => Promise<void>;
  loading: boolean;
}

/**
 * Trae las notificaciones del usuario logueado (RLS filtra a las propias),
 * se suscribe a INSERTs por Realtime y expone el contador de no leídas.
 */
export function useNotifications(): UseNotifications {
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!mounted) return;
        setItems((data as Notification[]) ?? []);
        setLoading(false);
      });

    const ch = supabase
      .channel(`notif-${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        (payload) => {
          const fresh = payload.new as Notification;
          setItems((prev) => {
            if (prev.some((n) => n.id === fresh.id)) return prev;
            return [fresh, ...prev].slice(0, 50);
          });
        },
      )
      .subscribe();
    channelRef.current = ch;

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [uid]);

  const unread = items.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);

  const markAllRead = useCallback(async () => {
    if (!uid) return;
    if (!items.some((n) => !n.read)) return;
    // Optimista: marcamos local primero.
    setItems((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', uid)
      .eq('read', false);
  }, [uid, items]);

  return { items, unread, markAllRead, loading };
}
