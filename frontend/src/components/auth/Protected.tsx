'use client';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { homeFor } from '@/lib/routes';
import { FullScreenLoader } from '@/components/ui';
import type { UserRole } from '@/types/database';

interface ProtectedProps {
  children: ReactNode;
  role?: UserRole | UserRole[];
}

/** Guard de cliente: exige sesión y (opcional) un rol. Redirige si no corresponde. */
export function Protected({ children, role }: ProtectedProps) {
  const { loading, session, role: myRole } = useAuth();
  const router = useRouter();

  const allowed = role ? (Array.isArray(role) ? role : [role]) : null;
  const roleOk = !allowed || (myRole != null && allowed.includes(myRole));

  useEffect(() => {
    if (loading) return;
    if (!session) { router.replace('/login'); return; }
    if (allowed && !roleOk) { router.replace(homeFor(myRole)); }
  }, [loading, session, roleOk, allowed, myRole, router]);

  if (loading) return <FullScreenLoader />;
  if (!session) return <FullScreenLoader label="Redirigiendo…" />;
  if (allowed && !roleOk) return <FullScreenLoader label="Redirigiendo…" />;
  return <>{children}</>;
}
