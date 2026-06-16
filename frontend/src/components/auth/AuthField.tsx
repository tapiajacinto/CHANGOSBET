'use client';
import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { Icon, IconName } from '@/components/ui';

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: IconName;
  error?: string | null;
}

/** Campo de formulario para las pantallas de auth (theme-aware). */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { label, icon, error, className, id, type = 'text', ...props }, ref,
) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputId = id || props.name;
  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle">
            <Icon name={icon} size={18} />
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={isPassword ? (show ? 'text' : 'password') : type}
          className={cn(
            'w-full rounded-xl border bg-surface-2 py-3 text-[15px] text-fg placeholder:text-fg-subtle',
            'transition-colors outline-none',
            icon ? 'pl-10' : 'pl-4',
            isPassword ? 'pr-11' : 'pr-4',
            error ? 'border-red-500/70 focus:border-red-400' : 'border-line focus:border-gold-400/80',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button" tabIndex={-1} onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-gold-400"
            aria-label={show ? 'Ocultar' : 'Mostrar'}
          >
            <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-400"><Icon name="alert" size={13} /> {error}</p>}
    </div>
  );
});
