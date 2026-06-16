import type { UserRole } from '@/types/database';

/** Pantalla de inicio según rol. */
export function homeFor(role: UserRole | null | undefined): string {
  if (role === 'admin') return '/admin';
  if (role === 'cashier') return '/cajero';
  return '/lobby';
}
