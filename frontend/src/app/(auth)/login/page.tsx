'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, PasswordInput } from '@/components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim() || !password) { setError('Completá teléfono y contraseña.'); return; }
    setLoading(true);
    const { error } = await login({ phone, password });
    setLoading(false);
    if (error) setError(error);
    // si OK, el layout redirige
  };

  return (
    <div className="rounded-4xl bg-white p-7 shadow-brand-lg">
      <h2 className="font-display text-xl font-bold text-brand-900">Iniciar sesión</h2>
      <p className="mb-5 text-sm text-gray-400">Entrá con tu teléfono y contraseña.</p>

      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Teléfono" name="phone" type="tel" inputMode="tel" autoComplete="tel"
          placeholder="Ej: 11 2345 6789" leftIcon="📱"
          value={phone} onChange={(e) => { setPhone(e.target.value); setError(null); }}
        />
        <PasswordInput
          label="Contraseña" name="password" autoComplete="current-password" placeholder="••••••••"
          value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }}
          error={error}
        />
        <Button type="submit" fullWidth size="lg" loading={loading}>Entrar 🎲</Button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        ¿No tenés cuenta?{' '}
        <Link href="/register" className="font-bold text-brand-700 hover:underline">Registrate</Link>
      </p>
    </div>
  );
}
