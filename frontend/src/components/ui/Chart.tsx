'use client';
import { useId } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/* ════════════════════════════════════════════════════════════════
   Gráficos SVG ligeros (sin dependencias). Theme-aware vía color props.
   ════════════════════════════════════════════════════════════════ */

const TONE: Record<string, string> = {
  brand: '#ed2f2f',
  gold:  '#e8b923',
  win:   '#1fd65f',
  red:   '#ed2f2f',
  muted: 'rgb(var(--fg-subtle))',
};

function resolveColor(c?: string) {
  if (!c) return TONE.win;
  return TONE[c] ?? c;
}

function buildSmoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

/** Línea + área suave. */
export function Sparkline({
  data, color = 'win', height = 44, className, strokeWidth = 2, fill = true,
}: {
  data: number[]; color?: string; height?: number; className?: string; strokeWidth?: number; fill?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const stroke = resolveColor(color);
  const W = 100, H = 40, pad = 3;
  const series = data.length ? data : [0, 0];
  const min = Math.min(...series), max = Math.max(...series);
  const span = max - min || 1;
  const pts = series.map((v, i) => ({
    x: pad + (i / (series.length - 1 || 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / span) * (H - pad * 2),
  }));
  const line = buildSmoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none"
      className={cn('overflow-visible', className)} aria-hidden>
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#sp-${id})`} />}
      <path d={line} fill="none" stroke={stroke} strokeWidth={strokeWidth}
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.4" fill={stroke} />
    </svg>
  );
}

/** Barras verticales con la última destacada. */
export function MiniBars({
  data, color = 'gold', height = 48, className, highlightLast = true,
}: {
  data: number[]; color?: string; height?: number; className?: string; highlightLast?: boolean;
}) {
  const fillColor = resolveColor(color);
  const series = data.length ? data : [0];
  const max = Math.max(...series, 1);
  const n = series.length;
  const gap = 2.2, W = 100, H = 40;
  const bw = (W - gap * (n - 1)) / n;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none"
      className={className} aria-hidden>
      {series.map((v, i) => {
        const h = Math.max(2, (v / max) * (H - 2));
        const last = i === n - 1;
        return (
          <rect key={i} x={i * (bw + gap)} y={H - h} width={bw} height={h} rx={Math.min(bw / 2, 1.6)}
            fill={fillColor} opacity={highlightLast ? (last ? 1 : 0.34) : 0.6} />
        );
      })}
    </svg>
  );
}

/** Anillo de progreso (value 0–1). */
export function ProgressRing({
  value, size = 72, stroke = 7, color = 'win', track, label, sublabel, className, children,
}: {
  value: number; size?: number; stroke?: number; color?: string; track?: string;
  label?: string; sublabel?: string; className?: string; children?: React.ReactNode;
}) {
  const c = resolveColor(color);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className={cn('relative grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          stroke={track ?? 'rgb(var(--line))'} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke={c}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      {children ? (
        <div className="absolute inset-0 grid place-content-center text-center leading-none">{children}</div>
      ) : (label || sublabel) ? (
        <div className="absolute inset-0 grid place-content-center text-center leading-none">
          {label && <span className="font-display text-sm font-extrabold text-fg">{label}</span>}
          {sublabel && <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-fg-subtle">{sublabel}</span>}
        </div>
      ) : null}
    </div>
  );
}

/** Donut de segmentos {value,color}. */
export function Donut({
  segments, size = 96, stroke = 12, className, children,
}: {
  segments: { value: number; color: string }[]; size?: number; stroke?: number; className?: string; children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
  let offset = 0;
  return (
    <div className={cn('relative grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="rgb(var(--line))" />
        {segments.map((s, i) => {
          const frac = Math.max(0, s.value) / total;
          const dash = `${frac * circ} ${circ}`;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
              stroke={resolveColor(s.color)} strokeDasharray={dash} strokeDashoffset={-offset * circ}
              strokeLinecap="butt" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
          );
          offset += frac;
          return el;
        })}
      </svg>
      {children && <div className="absolute inset-0 grid place-content-center text-center">{children}</div>}
    </div>
  );
}

/** Barra horizontal de progreso. */
export function BarTrack({
  value, color = 'win', className, height = 8,
}: { value: number; color?: string; className?: string; height?: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-surface-2', className)} style={{ height }}>
      <div className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${pct}%`, background: resolveColor(color) }} />
    </div>
  );
}

/** Pill de tendencia +/-% con flecha. */
export function TrendPill({ delta, className, suffix = '%' }: { delta: number; className?: string; suffix?: string }) {
  const up = delta >= 0;
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums',
      up ? 'bg-win-500/15 text-win-600 dark:text-win-400' : 'bg-brand-500/15 text-brand-600 dark:text-brand-400',
      className,
    )}>
      <Icon name="arrowRight" size={11} className={up ? '-rotate-45' : 'rotate-45'} />
      {up ? '+' : ''}{delta.toFixed(1)}{suffix}
    </span>
  );
}
