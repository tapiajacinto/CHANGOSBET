# 🎰 CHANGOSBET — Guía de instalación

Casino virtual multijugador con **economía de fichas de plata real**: los **cajeros** cargan
y pagan fichas, los **socios (admin)** administran todo, y los **jugadores** juegan en salas
privadas. Arquitectura **100% Vercel + Supabase** (sin backend propio, sin Railway).

## Requisitos
- Node.js 18+
- npm 9+
- Un proyecto de Supabase

## Instalación

```bash
# Desde la raíz
npm run install:all      # instala raíz + frontend
```

## Variables de entorno

`frontend/.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<tu-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key LEGACY>   # ojo: legacy JWT, no la publishable
```
> Se usa la **anon key legacy** a propósito (supabase-js 2.39.3). No usar `sb_publishable_`.

## Base de datos (Supabase)

El schema está en `supabase/migrations/` (migraciones `0001`→`0008`). Aplicar con la CLI
(`supabase db push`) o copiando cada archivo al SQL Editor en orden. Crea:
`profiles · cashier_accounts · transactions` (ledger append-only) `· rooms · notifications`,
RLS por rol, RPCs de plata atómicas y vistas de reconciliación.

### Pasos manuales (no son SQL — se hacen en el Dashboard de Supabase)
1. **Authentication → Providers → Phone**: habilitar. **Desactivar "Confirm phone"**
   (no se envía OTP; el login es teléfono + contraseña).
2. **Authentication → Hooks → Custom Access Token**: registrar la función
   `public.custom_access_token_hook` (inyecta el rol en el JWT para RLS).
3. **Primer admin (socio):** registrate normalmente en la app y luego, una sola vez, corré en
   el SQL Editor:
   ```sql
   update public.profiles set role='admin', status='active'
   where phone = '+54...';   -- tu teléfono en E.164
   ```
   Desde ahí, el panel admin maneja el resto (crear cajeros, asignar float, etc.).

## Correr en desarrollo

```bash
npm run dev      # frontend en http://localhost:3000
```

## Flujo de uso
1. **Registro:** alias + teléfono + contraseña → cuenta queda *pendiente*.
2. **Activación:** un **cajero** te busca por teléfono/alias y te **activa** (te asocia a su caja).
3. **Carga:** el cajero te **carga fichas** (a cambio de tu plata).
4. **Jugar:** creás o te unís a una sala por código y jugás.
5. **Retiro:** el cajero te **paga** tus fichas cuando querés cobrar.

### Roles
- **Jugador** (`/lobby`, `/wallet`, `/room/[code]`)
- **Cajero** (`/cajero`): activar jugadores, cargar/retirar fichas, historial, caja.
- **Socio/Admin** (`/admin`): dashboard de totales, cajeros, jugadores, reconciliación.

## Juegos
- 🎡 Ruleta Europea · 🃏 Blackjack · 🏇 Carreras de Caballos · ⚽ Fútbol  → activos, con plata real.
- ♠️ Poker → **en mantenimiento** (se reactiva cuando se integre la economía de fichas a las
  ciegas/pozos del poker).

> Las fichas se **debitan al apostar** (RPC `place_bet`) y las ganancias se **acreditan**
> automáticamente al cerrar la ronda (RPC `settle_game_round`, con tope e idempotencia). Ya no
> hay "recarga gratis": las fichas solo entran por un cajero.

## Deploy
- **Frontend → Vercel**: root del proyecto = `frontend/`. Setear las env `NEXT_PUBLIC_*` y
  (si se usan acciones admin server-side) `SUPABASE_SERVICE_ROLE_KEY`.
- **Base de datos → Supabase** (la del proyecto).
