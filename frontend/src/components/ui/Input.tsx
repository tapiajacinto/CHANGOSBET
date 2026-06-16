'use client';
import { InputHTMLAttributes, forwardRef, ReactNode, useState } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  hint?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, className, id, ...props }, ref,
) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-fg-muted">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-2xl border bg-surface px-4 py-3.5 text-[15px] text-fg placeholder:text-fg-subtle',
            'transition-all focus:outline-none focus:ring-4',
            leftIcon && 'pl-10',
            error
              ? 'border-brand-400 focus:border-brand-500 focus:ring-brand-500/15'
              : 'border-line-2 focus:border-brand-500 focus:ring-brand-500/15',
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-500"><Icon name="alert" size={13} /> {error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} {...props} type={show ? 'text' : 'password'} />
      <button
        type="button" onClick={() => setShow((s) => !s)} tabIndex={-1}
        className="absolute right-3.5 top-[38px] text-fg-subtle hover:text-brand-600"
        aria-label={show ? 'Ocultar' : 'Mostrar'}
      >
        <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
      </button>
    </div>
  );
});
