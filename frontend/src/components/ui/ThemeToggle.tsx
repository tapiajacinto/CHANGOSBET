'use client';
import { cn } from '@/lib/cn';
import { useTheme } from '@/contexts/ThemeContext';
import { Icon } from './Icon';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo nocturno'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo nocturno'}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-xl border border-line/70 text-fg-muted',
        'transition-colors hover:text-gold-400 hover:border-gold-400/40',
        className,
      )}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
