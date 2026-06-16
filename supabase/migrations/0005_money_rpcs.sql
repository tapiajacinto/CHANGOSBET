-- 0005_money_rpcs
-- TODA mutación de plata pasa por acá. SECURITY DEFINER + search_path pinneado +
-- FOR UPDATE (serializa) + CHECK(>=0) (backstop) → sin negativos ni doble gasto.
-- Cada función revalida rol/ownership contra la tabla live (no confía en el JWT).

-- ── Cajero: cargar fichas (vende fichas, entra efectivo) ───────────────────────
create or replace function public.cashier_load_chips(p_player uuid, p_amount bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_caller uuid := auth.uid(); v_role public.user_role;
  v_pstatus public.user_status; v_pcashier uuid;
  v_float bigint; v_newbal bigint; v_newfloat bigint;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'El monto debe ser positivo'; end if;
  select role into v_role from public.profiles where id = v_caller;
  if v_role is distinct from 'cashier' then raise exception 'No autorizado'; end if;

  select float_balance into v_float
  from public.cashier_accounts where cashier_id = v_caller for update;
  if not found then raise exception 'Caja del cajero inexistente'; end if;

  select status, cashier_id into v_pstatus, v_pcashier
  from public.profiles where id = p_player for update;
  if not found then raise exception 'Jugador no encontrado'; end if;
  if v_pstatus is distinct from 'active' then raise exception 'El jugador no está activo'; end if;
  if v_pcashier is distinct from v_caller then raise exception 'El jugador no pertenece a este cajero'; end if;
  if v_float < p_amount then raise exception 'Float insuficiente'; end if;

  update public.cashier_accounts
    set float_balance = float_balance - p_amount, cash_on_hand = cash_on_hand + p_amount
    where cashier_id = v_caller returning float_balance into v_newfloat;
  update public.profiles set balance = balance + p_amount
    where id = p_player returning balance into v_newbal;

  insert into public.transactions
    (type, amount, player_id, cashier_id, player_balance_after, float_balance_after, created_by)
  values ('cashier_load', p_amount, p_player, v_caller, v_newbal, v_newfloat, v_caller);
  insert into public.notifications (user_id, type, title, body)
  values (p_player, 'chips_loaded', 'Fichas cargadas', 'Te cargaron ' || p_amount::text || ' fichas. ¡A jugar!');
  return v_newbal;
end $$;

-- ── Cajero: retirar/pagar fichas (inverso) ─────────────────────────────────────
create or replace function public.cashier_withdraw_chips(p_player uuid, p_amount bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_caller uuid := auth.uid(); v_role public.user_role;
  v_pstatus public.user_status; v_pcashier uuid; v_pbal bigint;
  v_newbal bigint; v_newfloat bigint;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'El monto debe ser positivo'; end if;
  select role into v_role from public.profiles where id = v_caller;
  if v_role is distinct from 'cashier' then raise exception 'No autorizado'; end if;

  perform 1 from public.cashier_accounts where cashier_id = v_caller for update;
  if not found then raise exception 'Caja del cajero inexistente'; end if;

  select status, cashier_id, balance into v_pstatus, v_pcashier, v_pbal
  from public.profiles where id = p_player for update;
  if not found then raise exception 'Jugador no encontrado'; end if;
  if v_pstatus is distinct from 'active' then raise exception 'El jugador no está activo'; end if;
  if v_pcashier is distinct from v_caller then raise exception 'El jugador no pertenece a este cajero'; end if;
  if v_pbal < p_amount then raise exception 'Saldo insuficiente del jugador'; end if;

  update public.profiles set balance = balance - p_amount
    where id = p_player returning balance into v_newbal;
  update public.cashier_accounts
    set float_balance = float_balance + p_amount, cash_on_hand = cash_on_hand - p_amount
    where cashier_id = v_caller returning float_balance into v_newfloat;

  insert into public.transactions
    (type, amount, player_id, cashier_id, player_balance_after, float_balance_after, created_by)
  values ('cashier_withdraw', p_amount, p_player, v_caller, v_newbal, v_newfloat, v_caller);
  insert into public.notifications (user_id, type, title, body)
  values (p_player, 'withdraw_ok', 'Retiro confirmado', 'Retiraste ' || p_amount::text || ' fichas.');
  return v_newbal;
end $$;

-- ── Admin: asignar/ajustar float a un cajero (signed) ──────────────────────────
create or replace function public.admin_assign_float(p_cashier uuid, p_amount bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := auth.uid(); v_role public.user_role; v_trole public.user_role; v_newfloat bigint;
begin
  if p_amount is null or p_amount = 0 then raise exception 'El monto debe ser distinto de cero'; end if;
  select role into v_role from public.profiles where id = v_caller;
  if v_role is distinct from 'admin' then raise exception 'No autorizado'; end if;
  select role into v_trole from public.profiles where id = p_cashier;
  if v_trole is distinct from 'cashier' then raise exception 'El destino no es un cajero'; end if;

  update public.cashier_accounts set float_balance = float_balance + p_amount
    where cashier_id = p_cashier returning float_balance into v_newfloat;
  if not found then raise exception 'Caja del cajero inexistente'; end if;

  insert into public.transactions (type, amount, cashier_id, float_balance_after, created_by, meta)
  values ('float_assign', abs(p_amount), p_cashier, v_newfloat, v_caller,
          jsonb_build_object('signed_amount', p_amount));
  return v_newfloat;
end $$;

-- ── Cajero: activar jugador pendiente (lo reclama) ─────────────────────────────
create or replace function public.activate_player(p_player uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := auth.uid(); v_role public.user_role;
        v_status public.user_status; v_prole public.user_role;
begin
  select role into v_role from public.profiles where id = v_caller;
  if v_role is distinct from 'cashier' then raise exception 'No autorizado'; end if;
  select status, role into v_status, v_prole from public.profiles where id = p_player for update;
  if not found then raise exception 'Jugador no encontrado'; end if;
  if v_prole is distinct from 'player' then raise exception 'Solo se pueden activar jugadores'; end if;
  if v_status is distinct from 'pending' then raise exception 'El jugador no está pendiente'; end if;

  update public.profiles set status = 'active', cashier_id = v_caller where id = p_player;
  insert into public.notifications (user_id, type, title, body)
  values (p_player, 'activated', 'Cuenta activada', 'Tu cuenta fue activada. ¡Ya podés jugar!');
end $$;

-- ── Admin: cambiar rol (crea caja al promover a cajero) ────────────────────────
create or replace function public.admin_set_role(p_user uuid, p_role public.user_role)
returns void language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := auth.uid(); v_role public.user_role;
begin
  select role into v_role from public.profiles where id = v_caller;
  if v_role is distinct from 'admin' then raise exception 'No autorizado'; end if;
  if not exists (select 1 from public.profiles where id = p_user) then raise exception 'Usuario no encontrado'; end if;

  update public.profiles
    set role = p_role,
        status = case when p_role = 'player' then 'pending' else 'active' end,
        cashier_id = null
    where id = p_user;
  if p_role = 'cashier' then
    insert into public.cashier_accounts (cashier_id) values (p_user) on conflict (cashier_id) do nothing;
  end if;
end $$;

-- ── Admin: bloquear/activar/poner pendiente a un usuario ───────────────────────
create or replace function public.admin_set_status(p_user uuid, p_status public.user_status)
returns void language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := auth.uid(); v_role public.user_role; v_urole public.user_role; v_ucashier uuid;
begin
  select role into v_role from public.profiles where id = v_caller;
  if v_role is distinct from 'admin' then raise exception 'No autorizado'; end if;
  select role, cashier_id into v_urole, v_ucashier from public.profiles where id = p_user;
  if not found then raise exception 'Usuario no encontrado'; end if;
  if p_status = 'active' and v_urole = 'player' and v_ucashier is null then
    raise exception 'El jugador debe tener un cajero asignado para activarse';
  end if;
  update public.profiles set status = p_status where id = p_user;
end $$;

-- ── Admin: ajuste manual de saldo (auditado) ───────────────────────────────────
create or replace function public.admin_adjust_balance(p_player uuid, p_delta bigint, p_reason text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := auth.uid(); v_role public.user_role; v_newbal bigint; v_pcashier uuid;
begin
  if p_delta is null or p_delta = 0 then raise exception 'El ajuste debe ser distinto de cero'; end if;
  select role into v_role from public.profiles where id = v_caller;
  if v_role is distinct from 'admin' then raise exception 'No autorizado'; end if;
  select cashier_id into v_pcashier from public.profiles where id = p_player for update;
  if not found then raise exception 'Jugador no encontrado'; end if;

  update public.profiles set balance = balance + p_delta
    where id = p_player returning balance into v_newbal;
  insert into public.transactions
    (type, amount, player_id, cashier_id, player_balance_after, created_by, meta)
  values ('adjustment', abs(p_delta), p_player, v_pcashier, v_newbal, v_caller,
          jsonb_build_object('signed_amount', p_delta, 'reason', coalesce(p_reason,'')));
  return v_newbal;
end $$;

-- ── Jugador: apostar (débito autoseguro de su propio saldo) ────────────────────
create or replace function public.place_bet(p_round uuid, p_amount bigint, p_game_type text, p_room_code text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := auth.uid(); v_status public.user_status;
        v_bal bigint; v_newbal bigint; v_cashier uuid; v_cap bigint := 100000000;
begin
  if p_amount is null or p_amount <= 0 or p_amount > v_cap then raise exception 'Monto de apuesta inválido'; end if;
  select status, balance, cashier_id into v_status, v_bal, v_cashier
  from public.profiles where id = v_caller for update;
  if not found then raise exception 'Perfil no encontrado'; end if;
  if v_status is distinct from 'active' then raise exception 'Jugador no activo'; end if;
  if v_bal < p_amount then raise exception 'Saldo insuficiente'; end if;

  update public.profiles set balance = balance - p_amount
    where id = v_caller returning balance into v_newbal;
  insert into public.transactions
    (type, amount, player_id, cashier_id, player_balance_after, game_type, room_code, round_id, created_by)
  values ('bet', p_amount, v_caller, v_cashier, v_newbal, p_game_type, p_room_code, p_round, v_caller);
  return v_newbal;
end $$;

-- ── Host: liquidar ganancias del round (idempotente + capeado + auditado) ──────
create or replace function public.settle_game_round(p_round uuid, p_game_type text, p_room_code text, p_payouts jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_caller uuid := auth.uid(); v_is_host boolean;
  v_total_bets bigint; v_total_payout bigint := 0; v_round_cap_multiple int := 50;
  rec jsonb; v_pid uuid; v_amt bigint; v_newbal bigint; v_pcashier uuid;
begin
  select (host_id = v_caller) into v_is_host from public.rooms where code = p_room_code;
  if v_is_host is not true then raise exception 'Solo el host puede liquidar'; end if;
  if exists (select 1 from public.transactions where round_id = p_round and type = 'win') then
    raise exception 'Round ya liquidado';
  end if;

  select coalesce(sum(amount),0) into v_total_bets
  from public.transactions where round_id = p_round and type = 'bet';

  for rec in select * from jsonb_array_elements(coalesce(p_payouts, '[]'::jsonb)) loop
    v_amt := (rec->>'amount')::bigint;
    if v_amt is null or v_amt <= 0 then raise exception 'Monto de pago inválido'; end if;
    v_total_payout := v_total_payout + v_amt;
  end loop;
  if v_total_payout > v_total_bets * v_round_cap_multiple then
    raise exception 'El pago excede el límite por round';
  end if;

  for rec in select * from jsonb_array_elements(coalesce(p_payouts, '[]'::jsonb)) loop
    v_pid := (rec->>'player')::uuid;
    v_amt := (rec->>'amount')::bigint;
    select cashier_id into v_pcashier from public.profiles where id = v_pid for update;
    update public.profiles set balance = balance + v_amt
      where id = v_pid and status = 'active' returning balance into v_newbal;
    if not found then raise exception 'Destino del pago no activo'; end if;
    insert into public.transactions
      (type, amount, player_id, cashier_id, player_balance_after, game_type, room_code, round_id, created_by, meta)
    values ('win', v_amt, v_pid, v_pcashier, v_newbal, p_game_type, p_room_code, p_round, v_caller,
            jsonb_build_object('settled_by_host', v_caller));
  end loop;
end $$;

-- ── Admin: cierre de caja (snapshot) ───────────────────────────────────────────
create or replace function public.admin_close_caja(p_cashier uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := auth.uid(); v_role public.user_role; v_float bigint; v_cash bigint; v_snapshot jsonb;
begin
  select role into v_role from public.profiles where id = v_caller;
  if v_role is distinct from 'admin' then raise exception 'No autorizado'; end if;
  select float_balance, cash_on_hand into v_float, v_cash
  from public.cashier_accounts where cashier_id = p_cashier for update;
  if not found then raise exception 'Caja inexistente'; end if;

  v_snapshot := jsonb_build_object('float_balance', v_float, 'cash_on_hand', v_cash, 'closed_at', now());
  insert into public.transactions (type, amount, cashier_id, float_balance_after, created_by, meta)
  values ('settlement', greatest(abs(v_cash), 1), p_cashier, v_float, v_caller, v_snapshot);
  return v_snapshot;
end $$;

-- ── Grants: revocar de anon/public, otorgar a authenticated ────────────────────
revoke execute on function public.cashier_load_chips(uuid,bigint)        from anon, public;
revoke execute on function public.cashier_withdraw_chips(uuid,bigint)    from anon, public;
revoke execute on function public.admin_assign_float(uuid,bigint)        from anon, public;
revoke execute on function public.activate_player(uuid)                  from anon, public;
revoke execute on function public.admin_set_role(uuid,public.user_role)  from anon, public;
revoke execute on function public.admin_set_status(uuid,public.user_status) from anon, public;
revoke execute on function public.admin_adjust_balance(uuid,bigint,text) from anon, public;
revoke execute on function public.place_bet(uuid,bigint,text,text)       from anon, public;
revoke execute on function public.settle_game_round(uuid,text,text,jsonb) from anon, public;
revoke execute on function public.admin_close_caja(uuid)                 from anon, public;

grant execute on function public.cashier_load_chips(uuid,bigint)         to authenticated;
grant execute on function public.cashier_withdraw_chips(uuid,bigint)     to authenticated;
grant execute on function public.admin_assign_float(uuid,bigint)         to authenticated;
grant execute on function public.activate_player(uuid)                   to authenticated;
grant execute on function public.admin_set_role(uuid,public.user_role)   to authenticated;
grant execute on function public.admin_set_status(uuid,public.user_status) to authenticated;
grant execute on function public.admin_adjust_balance(uuid,bigint,text)  to authenticated;
grant execute on function public.place_bet(uuid,bigint,text,text)        to authenticated;
grant execute on function public.settle_game_round(uuid,text,text,jsonb) to authenticated;
grant execute on function public.admin_close_caja(uuid)                  to authenticated;
