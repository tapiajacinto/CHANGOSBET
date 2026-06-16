'use client';
import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'section' | 'article';
  padded?: boolean;
  hover?: boolean;
}

export function Card({ className, padded = true, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl bg-white border border-brand-100 shadow-card',
        padded && 'p-5 sm:p-6',
        hover && 'transition-all hover:shadow-card-hover hover:-translate-y-0.5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ icon, title, subtitle, action }: {
  icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {icon && (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-lg text-white shadow-brand">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-base font-bold text-brand-900 leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
