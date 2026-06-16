-- 0004_rls
-- Modelo de privilegios: revoke amplio + grants mínimos por columna; RLS por fila.
-- Escrituras de plata: NINGÚN grant a authenticated → solo las RPCs SECURITY DEFINER.

-- ── Revocar todo a anon/authenticated (service_role conserva acceso, bypassa RLS) ──
revoke all on public.profiles         from anon, authenticated;
revoke all on public.cashier_accounts from anon, authenticated;
revoke all on public.transactions     from anon, authenticated;
revoke all on public.rooms            from anon, authenticated;
revoke all on public.notifications    from anon, authenticated;

-- ── Grants mínimos ─────────────────────────────────────────────────────────────
grant select               on public.profiles         to authenticated;
grant update (alias)       on public.profiles         to authenticated;  -- solo alias
grant select               on public.cashier_accounts to authenticated;
grant select               on public.transactions     to authenticated;
grant select, insert, update on public.rooms          to authenticated;
grant select               on public.notifications    to authenticated;
grant update (read)        on public.notifications    to authenticated;  -- solo marcar leído

-- ── Enable RLS ─────────────────────────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.cashier_accounts enable row level security;
alter table public.transactions     enable row level security;
alter table public.rooms            enable row level security;
alter table public.notifications    enable row level security;

-- ── profiles ───────────────────────────────────────────────────────────────────
-- SELECT: uno mismo; admin todo; cajero ve sus asignados + los pending (para activar).
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.auth_role() = 'admin'
    or (public.auth_role() = 'cashier' and (cashier_id = auth.uid() or status = 'pending'))
  );
-- UPDATE: solo la fila propia (el grant de columna ya limita a `alias`).
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
-- El auth server (hook) necesita leer roles aunque haya RLS.
create policy profiles_auth_admin_read on public.profiles
  for select to supabase_auth_admin using (true);

-- ── cashier_accounts ─────────────────────────────────────────────────────────────
create policy cashier_acct_select on public.cashier_accounts
  for select to authenticated
  using (cashier_id = auth.uid() or public.auth_role() = 'admin');

-- ── transactions (ledger) ────────────────────────────────────────────────────────
-- admin todo; jugador su propio ledger; cajero el ledger donde figura como cajero
-- (las cargas/retiros y también bet/win de sus jugadores llevan su cashier_id).
create policy txn_select on public.transactions
  for select to authenticated
  using (
    public.auth_role() = 'admin'
    or player_id  = auth.uid()
    or cashier_id = auth.uid()
  );

-- ── rooms (estado de juego, sin plata) ─────────────────────────────────────────
create policy rooms_select on public.rooms
  for select to authenticated using (true);
create policy rooms_insert on public.rooms
  for insert to authenticated
  with check (
    host_id = auth.uid()
    and (select status from public.profiles where id = auth.uid()) = 'active'
  );
create policy rooms_update_host on public.rooms
  for update to authenticated
  using (host_id = auth.uid()) with check (host_id = auth.uid());

-- ── notifications ──────────────────────────────────────────────────────────────
create policy notif_select on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notif_update_read on public.notifications
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
