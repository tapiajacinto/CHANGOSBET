'use client';
import { InputHTMLAttributes, forwardRef, ReactNode, useState } from 'react';
import { cn } from '@/lib/cn';

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
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-brand-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-2xl border-2 bg-white px-4 py-3.5 text-[15px] text-gray-800 placeholder:text-gray-300',
            'transition-colors focus:outline-none',
            leftIcon && 'pl-10',
            error ? 'border-red-400 focus:border-red-500' : 'border-brand-100 focus:border-brand-500',
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-red-500">⚠ {error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-gray-400">{hint}</p>
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
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3.5 top-[38px] text-gray-400 hover:text-brand-600"
        tabIndex={-1}
        aria-label={show ? 'Ocultar' : 'Mostrar'}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
});
