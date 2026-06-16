'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, PasswordInput } from '@/components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const [alias, setAlias] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (alias.trim().length < 2) { setError('El alias debe tener al menos 2 caracteres.'); return; }
    if (!phone.trim()) { setError('Ingresá tu teléfono.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true);
    const { error } = await register({ alias, phone, password });
    setLoading(false);
    if (error) setError(error);
    // si OK, el layout redirige (queda pendiente de activación)
  };

  return (
    <div className="rounded-4xl bg-white p-7 shadow-brand-lg">
      <h2 className="font-display text-xl font-bold text-brand-900">Crear cuenta</h2>
      <p className="mb-5 text-sm text-gray-400">Registrate y un cajero te activa para empezar a jugar.</p>

      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Alias" name="alias" placeholder="Ej: ElChango23" maxLength={20} leftIcon="🎭"
          value={alias} onChange={(e) => { setAlias(e.target.value); setError(null); }}
        />
        <Input
          label="Teléfono" name="phone" type="tel" inputMode="tel" autoComplete="tel"
          placeholder="Ej: 11 2345 6789" leftIcon="📱"
          value={phone} onChange={(e) => { setPhone(e.target.value); setError(null); }}
          hint="Tu cajero te busca por este número."
        />
        <PasswordInput
          label="Contraseña" name="password" autoComplete="new-password" placeholder="Mínimo 6 caracteres"
          value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }}
        />
        <PasswordInput
          label="Repetir contraseña" name="confirm" autoComplete="new-password" placeholder="••••••••"
          value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(null); }}
          error={error}
        />
        <Button type="submit" fullWidth size="lg" loading={loading}>Crear cuenta 🎰</Button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-bold text-brand-700 hover:underline">Iniciá sesión</Link>
      </p>
    </div>
  );
}
