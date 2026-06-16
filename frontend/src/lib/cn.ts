// Mini helper para componer classNames condicionales (sin dependencias).
// Acepta cualquier valor y une solo los strings no vacíos — tolera patrones como
// `cond && 'clase'` aunque `cond` no sea booleano (ReactNode, number, etc.).
export function cn(...parts: unknown[]): string {
  return parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');
}
