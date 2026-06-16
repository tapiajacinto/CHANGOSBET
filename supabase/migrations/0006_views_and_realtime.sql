-- 0006_views_and_realtime
-- Vistas de reconciliación para el panel admin. security_invoker=on → respetan RLS:
-- el admin (RLS ve todo) obtiene los totales reales; cualquier otro rol no filtra datos
-- ajenos (a lo sumo ve lo propio, sin fuga). Invariante de conservación:
--   Σ balance jugadores == loaded − withdrawn + wins − bets

create view public.v_chips_in_circulation with (security_invoker = on) as
  select coalesce(sum(balance),0)::bigint as chips_in_circulation
  from public.profiles where role = 'player';

create view public.v_house_position with (security_invoker = on) as
  select
    coalesce(sum(amount) filter (where type='cashier_load'),0)::bigint     as total_loaded,
    coalesce(sum(amount) filter (where type='cashier_withdraw'),0)::bigint as total_withdrawn,
    coalesce(sum(amount) filter (where type='bet'),0)::bigint              as total_bets,
    coalesce(sum(amount) filter (where type='win'),0)::bigint              as total_wins,
    (coalesce(sum(amount) filter (where type='cashier_load'),0)
      - coalesce(sum(amount) filter (where type='cashier_withdraw'),0))::bigint as net_cash_position,
    (coalesce(sum(amount) filter (where type='bet'),0)
      - coalesce(sum(amount) filter (where type='win'),0))::bigint              as game_hold,
    (select coalesce(sum(balance),0) from public.profiles where role='player')::bigint
      as outstanding_chip_liability
  from public.transactions;

create view public.v_cashier_reconciliation with (security_invoker = on) as
  select
    c.cashier_id,
    p.alias                                                         as cashier_alias,
    c.float_balance,
    c.cash_on_hand,
    coalesce(l.loaded,0)::bigint                                    as total_loaded,
    coalesce(w.withdrawn,0)::bigint                                 as total_withdrawn,
    (coalesce(l.loaded,0) - coalesce(w.withdrawn,0))::bigint        as expected_cash,
    (c.cash_on_hand - (coalesce(l.loaded,0) - coalesce(w.withdrawn,0)))::bigint as cash_variance,
    coalesce(f.assigned,0)::bigint                                  as float_assigned_total,
    (coalesce(f.assigned,0) - (coalesce(l.loaded,0) - coalesce(w.withdrawn,0)))::bigint as expected_float,
    (c.float_balance - (coalesce(f.assigned,0) - (coalesce(l.loaded,0) - coalesce(w.withdrawn,0))))::bigint as float_variance
  from public.cashier_accounts c
  join public.profiles p on p.id = c.cashier_id
  left join (select cashier_id, sum(amount) loaded     from public.transactions where type='cashier_load'     group by 1) l on l.cashier_id = c.cashier_id
  left join (select cashier_id, sum(amount) withdrawn  from public.transactions where type='cashier_withdraw' group by 1) w on w.cashier_id = c.cashier_id
  left join (select cashier_id, sum((meta->>'signed_amount')::bigint) assigned from public.transactions where type='float_assign' group by 1) f on f.cashier_id = c.cashier_id;

revoke all on public.v_chips_in_circulation  from anon;
revoke all on public.v_house_position         from anon;
revoke all on public.v_cashier_reconciliation from anon;
grant select on public.v_chips_in_circulation  to authenticated;
grant select on public.v_house_position         to authenticated;
grant select on public.v_cashier_reconciliation to authenticated;

-- ── Realtime: rooms (estado juego), notifications (campanita), profiles (balance) ─
-- postgres_changes respeta RLS: cada quien recibe solo cambios de filas que puede leer.
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.profiles;
