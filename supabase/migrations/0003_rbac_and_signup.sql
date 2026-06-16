-- 0003_rbac_and_signup
-- Alta automática de perfil al registrarse + RBAC vía claim en el JWT.

-- ── Perfil automático al crearse el auth.user (registro) ───────────────────────
-- El cliente pasa alias en options.data.alias; el teléfono lo trae auth.users.phone.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, status, alias, phone, balance)
  values (
    new.id,
    'player',
    'pending',
    coalesce(nullif(new.raw_user_meta_data ->> 'alias',''), 'Jugador'),
    new.phone,
    0
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Custom Access Token Hook: inyecta user_role / user_status en el JWT ────────
-- Best practice 2026 para RBAC: RLS lee el rol del JWT (auth_role()) sin tocar la tabla.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  claims   jsonb := event->'claims';
  v_role   public.user_role;
  v_status public.user_status;
begin
  select role, status into v_role, v_status
  from public.profiles where id = (event->>'user_id')::uuid;

  if v_role is not null then
    claims := jsonb_set(claims, '{user_role}',   to_jsonb(v_role));
    claims := jsonb_set(claims, '{user_status}', to_jsonb(v_status));
  else
    claims := jsonb_set(claims, '{user_role}',   '"player"');
    claims := jsonb_set(claims, '{user_status}', '"pending"');
  end if;

  return jsonb_set(event, '{claims}', claims);
end $$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant select on public.profiles to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- ── Helpers de rol ─────────────────────────────────────────────────────────────
-- Lee el rol del JWT (barato, sin recursión de RLS sobre profiles).
create or replace function public.auth_role() returns public.user_role
language sql stable set search_path = '' as $$
  select coalesce(
    nullif(auth.jwt() ->> 'user_role','')::public.user_role,
    'player'::public.user_role
  );
$$;

-- Chequeo "live" contra la tabla (usado dentro de RPCs SECURITY DEFINER).
create or replace function public.authorize(required public.user_role) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare v public.user_role;
begin
  select role into v from public.profiles where id = auth.uid();
  return v = required;
end $$;
