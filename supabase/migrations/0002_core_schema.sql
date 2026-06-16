-- 0002_core_schema
-- Tablas centrales de la economía de fichas. La plata es autoritativa SOLO en
-- profiles.balance / cashier_accounts.float_balance, escrita únicamente por RPCs (0005).

-- Liberar el nombre de índice que quedó tomado por la tabla legacy renombrada en 0001.
alter index if exists public.idx_rooms_host rename to idx_zz_legacy_rooms_host;

-- ── Enums ────────────────────────────────────────────────────────────────────
create type public.user_role   as enum ('player','cashier','admin');
create type public.user_status as enum ('pending','active','blocked');
create type public.txn_type    as enum (
  'cashier_load',      -- cajero vende fichas al jugador (entra efectivo)
  'cashier_withdraw',  -- jugador cobra/retira vía cajero (sale efectivo)
  'bet',               -- débito de fichas por apuesta
  'win',               -- crédito de fichas por ganancia
  'float_assign',      -- admin carga float a un cajero
  'adjustment',        -- corrección manual del admin
  'settlement'         -- marca de cierre de caja
);

-- ── updated_at helper ────────────────────────────────────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ── profiles (1:1 con auth.users) ─────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        public.user_role   not null default 'player',
  status      public.user_status not null default 'pending',
  alias       text not null,
  phone       text unique,
  balance     bigint not null default 0 check (balance >= 0),
  cashier_id  uuid references public.profiles(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Un jugador activo debe pertenecer a un cajero.
  constraint player_active_requires_cashier check (
    not (role = 'player' and status = 'active' and cashier_id is null)
  ),
  -- Solo los players llevan cajero asignado.
  constraint only_players_have_cashier check (
    role = 'player' or cashier_id is null
  )
);
create index idx_profiles_cashier on public.profiles(cashier_id);
create index idx_profiles_role    on public.profiles(role);
create index idx_profiles_phone   on public.profiles(phone);
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── cashier_accounts (float del cajero, invariante distinto del balance) ───────
create table public.cashier_accounts (
  cashier_id    uuid primary key references public.profiles(id) on delete restrict,
  float_balance bigint not null default 0 check (float_balance >= 0),
  cash_on_hand  bigint not null default 0,   -- efectivo del que rinde cuentas (cierre)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_cashier_touch before update on public.cashier_accounts
  for each row execute function public.touch_updated_at();

-- ── transactions (ledger append-only) ─────────────────────────────────────────
create table public.transactions (
  id                    bigint generated always as identity primary key,
  type                  public.txn_type not null,
  amount                bigint not null check (amount > 0),
  player_id             uuid references public.profiles(id),
  cashier_id            uuid references public.profiles(id),
  player_balance_after  bigint,
  float_balance_after   bigint,
  game_type             text check (game_type in ('roulette','blackjack','poker','horses','football')),
  room_code             text,
  round_id              uuid,
  meta                  jsonb not null default '{}'::jsonb,
  created_by            uuid not null references public.profiles(id),
  created_at            timestamptz not null default now()
);
create index idx_txn_player  on public.transactions(player_id, created_at desc);
create index idx_txn_cashier on public.transactions(cashier_id, created_at desc);
create index idx_txn_type    on public.transactions(type, created_at);
create index idx_txn_round   on public.transactions(round_id) where round_id is not null;
create index idx_txn_created on public.transactions(created_at);

-- Append-only: correcciones = nueva fila, nunca UPDATE/DELETE. Las RPCs solo INSERT.
create or replace function public.deny_txn_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin raise exception 'transactions ledger is append-only'; end $$;
create trigger trg_txn_no_update before update on public.transactions
  for each row execute function public.deny_txn_mutation();
create trigger trg_txn_no_delete before delete on public.transactions
  for each row execute function public.deny_txn_mutation();

-- ── rooms (salas privadas; solo estado de juego, sin plata) ────────────────────
create table public.rooms (
  code       text primary key,
  name       text not null,
  game_type  text not null check (game_type in ('roulette','blackjack','poker','horses','football')),
  host_id    uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now()
);
create index idx_rooms_host on public.rooms(host_id);

-- ── notifications (in-app, reemplazan WhatsApp) ────────────────────────────────
create table public.notifications (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notif_user   on public.notifications(user_id, created_at desc);
create index idx_notif_unread on public.notifications(user_id) where read = false;
