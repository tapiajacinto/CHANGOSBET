-- 0001_retire_legacy  (NON-destructive)
-- Pivote a economía de plata real. En vez de DROP (irreversible), preservamos los
-- datos de prueba renombrándolos a zz_legacy_* (reversible) y liberamos el nombre `rooms`.
-- El usuario puede borrar las zz_legacy_* cuando quiera.

-- 1. Neutralizar add_to_balance: era SECURITY DEFINER ejecutable por anon (crítico).
drop function if exists public.add_to_balance(text, bigint);

-- 2. Preservar datos legacy fuera del camino (reversible).
alter table if exists public.rooms   rename to zz_legacy_rooms;
alter table if exists public.players rename to zz_legacy_players;

-- 3. Quitar las políticas allow-all de las tablas renombradas (higiene de seguridad).
drop policy if exists "allow_all_players" on public.zz_legacy_players;
drop policy if exists "allow_all_rooms"   on public.zz_legacy_rooms;
