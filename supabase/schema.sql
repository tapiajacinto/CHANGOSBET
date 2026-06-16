-- CHANGOSBET Schema
-- Ejecutar en el SQL Editor de Supabase

-- Usuarios
create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  alias text not null unique,
  balance bigint not null default 100000,
  total_won bigint not null default 0,
  total_lost bigint not null default 0,
  games_played int not null default 0,
  created_at timestamptz default now()
);

-- Salas
create table if not exists public.rooms (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  name text not null,
  game_type text not null check (game_type in ('roulette','blackjack','poker','horses','football')),
  host_id uuid references public.users(id),
  status text not null default 'active',
  created_at timestamptz default now(),
  ended_at timestamptz
);

-- Historial de partidas
create table if not exists public.game_history (
  id uuid default gen_random_uuid() primary key,
  room_code text not null,
  player_id uuid references public.users(id),
  alias text not null,
  game_type text not null,
  amount_bet bigint not null default 0,
  amount_won bigint not null default 0,
  result text,
  played_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table public.users enable row level security;
alter table public.rooms enable row level security;
alter table public.game_history enable row level security;

-- Policies: permitir todo por ahora (es un juego privado)
create policy "Allow all" on public.users for all using (true) with check (true);
create policy "Allow all" on public.rooms for all using (true) with check (true);
create policy "Allow all" on public.game_history for all using (true) with check (true);

-- Índices
create index if not exists idx_rooms_code on public.rooms(code);
create index if not exists idx_game_history_player on public.game_history(player_id);
create index if not exists idx_game_history_room on public.game_history(room_code);
