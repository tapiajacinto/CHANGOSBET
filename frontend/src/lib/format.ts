// Helpers de formato (es-AR).

/** Formatea fichas/montos con separador de miles argentino. */
export function formatChips(n: number | null | undefined): string {
  return new Intl.NumberFormat('es-AR').format(Math.round(Number(n ?? 0)));
}

/** Versión compacta para tarjetas de stats: 1.2M, 350K, etc. */
export function formatChipsCompact(n: number | null | undefined): string {
  const v = Math.round(Number(n ?? 0));
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return (v / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace('.0', '') + 'M';
  if (abs >= 1_000) return (v / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace('.0', '') + 'K';
  return String(v);
}

/**
 * Normaliza un teléfono ingresado por el usuario a E.164.
 * Default Argentina (+54). Si ya viene con '+', se respeta.
 */
export function toE164(raw: string, defaultCountry = '54'): string {
  const trimmed = (raw ?? '').trim();
  if (trimmed.startsWith('+')) return '+' + trimmed.slice(1).replace(/\D/g, '');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith(defaultCountry)) return '+' + digits;
  return '+' + defaultCountry + digits;
}

/** Muestra un teléfono de forma legible (mantiene el +). */
export function displayPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  return phone.startsWith('+') ? phone : '+' + phone;
}

/** "hace 5 min", "hace 2 h", "ayer", fecha corta. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'ayer';
  if (d < 7) return `hace ${d} días`;
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

/** Fecha + hora corta es-AR. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

/** Solo dígitos. */
export function onlyDigits(s: string | null | undefined): string {
  return (s ?? '').replace(/\D/g, '');
}

/** CUIT/CUIL válido = 11 dígitos. */
export function isValidCuit(raw: string | null | undefined): boolean {
  return onlyDigits(raw).length === 11;
}

/** Formatea CUIT como XX-XXXXXXXX-X mientras se tipea. */
export function formatCuit(raw: string | null | undefined): string {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 10) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

/** Edad en años a partir de una fecha ISO (YYYY-MM-DD). */
export function ageFromISO(iso: string | null | undefined): number {
  if (!iso) return 0;
  const b = new Date(iso);
  if (isNaN(b.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
