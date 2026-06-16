'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Icon } from '@/components/ui';
import { AuthField } from '@/components/auth/AuthField';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) return setError('Completá email y contraseña.');
    setLoading(true);
    const { error } = await login({ email, password });
    setLoading(false);
    if (error) setError(error);
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-brand-lg backdrop-blur-xl sm:p-8">
      <h2 className="font-display text-2xl font-bold">Iniciar sesión</h2>
      <p className="mb-6 mt-1 text-sm text-white/45">Entrá con tu email y contraseña.</p>

      <form onSubmit={submit} className="space-y-4">
        <AuthField label="Email" name="email" type="email" inputMode="email" icon="mail" placeholder="vos@email.com"
          value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} autoComplete="email" />
        <AuthField label="Contraseña" name="password" type="password" icon="lock" placeholder="••••••••"
          value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} autoComplete="current-password" error={error} />

        <Button type="submit" variant="gold" size="lg" fullWidth loading={loading} rightIcon={<Icon name="arrowRight" size={18} />}>
          Entrar
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-white/45">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="font-bold text-gold-300 hover:text-gold-200">Registrate</Link>
      </p>
    </div>
  );
}
