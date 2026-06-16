-- CHANGOSBET Schema para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run

-- Jugadores (sin Supabase Auth, UUID generado en el browser)
create table if not exists public.players (
  id       text primary key,
  alias    text not null,
  balance  bigint not null default 100000,
  created_at timestamptz default now()
);

-- Salas privadas
create table if not exists public.rooms (
  code       text primary key,
  name       text not null,
  game_type  text not null check (game_type in ('roulette','blackjack','poker','horses','football')),
  host_id    text not null references public.players(id),
  status     text default 'active',
  created_at timestamptz default now()
);

-- RLS permisivo (casino privado entre amigos, sin plata real)
alter table public.players enable row level security;
alter table public.rooms   enable row level security;

drop policy if exists "allow_all_players" on public.players;
drop policy if exists "allow_all_rooms"   on public.rooms;

create policy "allow_all_players" on public.players for all using (true) with check (true);
create policy "allow_all_rooms"   on public.rooms   for all using (true) with check (true);

-- Función para sumar/restar fichas (la ejecuta el host desde el browser)
create or replace function public.add_to_balance(p_id text, delta bigint)
returns bigint language sql security definer as $$
  update public.players
  set balance = greatest(0, balance + delta)
  where id = p_id
  returning balance;
$$;

-- Habilitar Supabase Realtime para las tablas
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.rooms;

-- Índices
create index if not exists idx_rooms_host on public.rooms(host_id);
