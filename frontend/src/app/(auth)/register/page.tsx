'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Icon } from '@/components/ui';
import { AuthField } from '@/components/auth/AuthField';
import { formatCuit, isValidCuit, ageFromISO, onlyDigits } from '@/lib/format';

export default function RegisterPage() {
  const { register } = useAuth();
  const [f, setF] = useState({ first_name: '', last_name: '', email: '', phone: '', cuit: '', birth_date: '', password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = k === 'cuit' ? formatCuit(e.target.value) : e.target.value;
    setF((prev) => ({ ...prev, [k]: v }));
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.first_name.trim().length < 2 || f.last_name.trim().length < 2) return setError('Ingresá nombre y apellido.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return setError('Email inválido.');
    if (onlyDigits(f.phone).length < 8) return setError('Ingresá un teléfono válido.');
    if (!isValidCuit(f.cuit)) return setError('CUIT/CUIL inválido (11 dígitos).');
    if (!f.birth_date || ageFromISO(f.birth_date) < 18) return setError('Tenés que ser mayor de 18 años.');
    if (f.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    if (f.password !== f.confirm) return setError('Las contraseñas no coinciden.');

    setLoading(true);
    const { error } = await register({
      first_name: f.first_name, last_name: f.last_name, email: f.email,
      phone: f.phone, cuit: f.cuit, birth_date: f.birth_date, password: f.password,
    });
    setLoading(false);
    if (error) setError(error);
  };

  return (
    <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-brand-lg backdrop-blur-xl sm:p-8">
      <h2 className="font-display text-2xl font-bold">Crear cuenta</h2>
      <p className="mb-6 mt-1 text-sm text-white/45">Registrate y un cajero te activa para empezar a jugar.</p>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField label="Nombre" name="first_name" icon="user" placeholder="Juan" value={f.first_name} onChange={set('first_name')} autoComplete="given-name" />
          <AuthField label="Apellido" name="last_name" icon="user" placeholder="Pérez" value={f.last_name} onChange={set('last_name')} autoComplete="family-name" />
        </div>
        <AuthField label="Email" name="email" type="email" inputMode="email" icon="mail" placeholder="vos@email.com" value={f.email} onChange={set('email')} autoComplete="email" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField label="Teléfono" name="phone" type="tel" inputMode="tel" icon="phone" placeholder="11 2345 6789" value={f.phone} onChange={set('phone')} autoComplete="tel" />
          <AuthField label="CUIT / CUIL" name="cuit" inputMode="numeric" icon="idCard" placeholder="20-12345678-3" value={f.cuit} onChange={set('cuit')} maxLength={13} />
        </div>
        <AuthField label="Fecha de nacimiento" name="birth_date" type="date" icon="calendar" value={f.birth_date} onChange={set('birth_date')} className="[color-scheme:dark]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField label="Contraseña" name="password" type="password" icon="lock" placeholder="Mín. 6" value={f.password} onChange={set('password')} autoComplete="new-password" />
          <AuthField label="Repetir" name="confirm" type="password" icon="lock" placeholder="Repetí" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-200">
            <Icon name="alert" size={16} /> {error}
          </div>
        )}

        <Button type="submit" variant="gold" size="lg" fullWidth loading={loading} rightIcon={<Icon name="arrowRight" size={18} />}>
          Crear cuenta
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-white/45">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-bold text-gold-300 hover:text-gold-200">Iniciá sesión</Link>
      </p>
    </div>
  );
}
