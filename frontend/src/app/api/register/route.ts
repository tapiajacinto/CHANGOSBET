import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { toE164, onlyDigits, ageFromISO } from '@/lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Registro robusto: crea el usuario YA confirmado con la service-role key,
// independientemente de la config de confirmaciones/proveedores de Supabase.
// El trigger handle_new_user crea el profile (queda 'pending' hasta que un cajero lo activa).
export async function POST(req: Request) {
  let body: Record<string, string>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 }); }

  const first_name = (body.first_name ?? '').trim();
  const last_name = (body.last_name ?? '').trim();
  const email = (body.email ?? '').trim().toLowerCase();
  const phone = (body.phone ?? '').trim();
  const cuit = onlyDigits(body.cuit);
  const birth_date = (body.birth_date ?? '').trim();
  const password = body.password ?? '';

  if (first_name.length < 2 || last_name.length < 2) return NextResponse.json({ error: 'Ingresá nombre y apellido.' }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
  if (onlyDigits(phone).length < 8) return NextResponse.json({ error: 'Teléfono inválido.' }, { status: 400 });
  if (cuit.length !== 11) return NextResponse.json({ error: 'CUIT/CUIL inválido (deben ser 11 dígitos).' }, { status: 400 });
  if (!birth_date || ageFromISO(birth_date) < 18) return NextResponse.json({ error: 'Tenés que ser mayor de 18 años.' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({
      error: 'El servidor no tiene la SUPABASE_SERVICE_ROLE_KEY configurada. Agregala en frontend/.env.local (y en Vercel) y reiniciá.',
    }, { status: 500 });
  }

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const e164 = toE164(phone);
  const alias = `${first_name} ${last_name.charAt(0).toUpperCase()}.`;

  const { error } = await admin.auth.admin.createUser({
    email,
    phone: e164,
    password,
    email_confirm: true,
    phone_confirm: true,
    user_metadata: { first_name, last_name, phone: e164, email, cuit, birth_date, alias },
  });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes('already') || m.includes('registered') || m.includes('exist') || m.includes('duplicate')) {
      return NextResponse.json({ error: 'Ese email o teléfono ya está registrado. Iniciá sesión.' }, { status: 409 });
    }
    return NextResponse.json({ error: `No se pudo crear la cuenta: ${error.message}` }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
