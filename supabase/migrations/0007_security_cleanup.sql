-- 0007_security_cleanup
-- Cerrar superficie de ataque señalada por los advisors.

-- handle_new_user es trigger: no debe exponerse como RPC (el trigger igual corre).
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- authorize() quedó sin uso (las policies usan auth_role() basado en JWT). Se elimina.
drop function if exists public.authorize(public.user_role);

-- Sacar las tablas legacy de la publicación realtime (ya no se usan).
alter publication supabase_realtime drop table public.zz_legacy_players;
alter publication supabase_realtime drop table public.zz_legacy_rooms;
