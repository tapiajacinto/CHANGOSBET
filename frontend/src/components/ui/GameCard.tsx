'use client';
import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, IconName } from './Icon';

interface GameCardProps {
  title: string;
  /** Foto de fondo (ej: /games/roulette.png). */
  image?: string;
  icon?: IconName;
  onClick?: () => void;
  selected?: boolean;
  soon?: boolean;
  disabled?: boolean;
  /** Esquina superior derecha (ej: <LiveDot/> o conteo de jugadores). */
  badge?: ReactNode;
  /** Texto bajo el título (ej: "12 jugando"). */
  meta?: string;
  aspect?: 'portrait' | 'wide' | 'square';
  className?: string;
}

const aspects = {
  portrait: 'aspect-[4/5]',
  wide:     'aspect-[16/10]',
  square:   'aspect-square',
};

/** Tile de juego con foto de fondo, velo y micro-interacción (estilo Stake). */
export function GameCard({
  title, image, icon, onClick, selected, soon, disabled, badge, meta, aspect = 'portrait', className,
}: GameCardProps) {
  const off = soon || disabled;
  return (
    <button
      type="button"
      onClick={off ? undefined : onClick}
      disabled={off}
      aria-pressed={selected}
      className={cn(
        'group relative flex w-full overflow-hidden rounded-3xl border text-left transition-all duration-300',
        aspects[aspect],
        off
          ? 'cursor-not-allowed border-line'
          : 'border-line hover:-translate-y-1 hover:border-brand-400/60 hover:shadow-card-hover',
        selected && 'border-brand-500 ring-2 ring-brand-500/60 shadow-brand',
        className,
      )}
    >
      {/* Imagen de fondo */}
      {image ? (
        <div
          className={cn(
            'absolute inset-0 bg-cover bg-center transition-transform duration-500',
            !off && 'group-hover:scale-110',
            off && 'grayscale',
          )}
          style={{ backgroundImage: `url(${image})` }}
          aria-hidden
        />
      ) : (
        <div className="absolute inset-0 bg-brand-deep" aria-hidden />
      )}

      {/* Velo para legibilidad */}
      <div className="absolute inset-0 bg-tile-fade" aria-hidden />
      {selected && <div className="absolute inset-0 bg-brand-500/15" aria-hidden />}

      {/* Esquina: badge / soon */}
      <div className="absolute left-0 right-0 top-0 flex items-start justify-between p-3">
        {icon ? (
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-black/35 text-white backdrop-blur-sm">
            <Icon name={icon} size={18} />
          </span>
        ) : <span />}
        {soon ? (
          <span className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-300 backdrop-blur-sm">
            Pronto
          </span>
        ) : badge}
      </div>

      {/* Pie: título + meta */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
        <div className="min-w-0">
          <p className="font-display text-base font-extrabold leading-tight text-white drop-shadow">{title}</p>
          {meta && <p className="mt-0.5 text-[11px] font-semibold text-white/75">{meta}</p>}
        </div>
        {!off && (
          <span className="grid h-8 w-8 shrink-0 translate-y-1 place-items-center rounded-full bg-brand-gradient text-white opacity-0 shadow-brand transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <Icon name="arrowRight" size={16} />
          </span>
        )}
      </div>

      {/* Check de seleccionado */}
      {selected && (
        <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-brand-gradient text-white shadow-brand">
          <Icon name="check" size={13} />
        </span>
      )}
    </button>
  );
}
