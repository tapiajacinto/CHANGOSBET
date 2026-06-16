-- 0008_fix_admin_set_role_enum_cast
-- Bug: el CASE de literales devolvía text y fallaba al asignarse a la columna enum status.
-- Fix: castear los literales a public.user_status.

create or replace function public.admin_set_role(p_user uuid, p_role public.user_role)
returns void language plpgsql security definer set search_path = '' as $$
declare v_caller uuid := auth.uid(); v_role public.user_role;
begin
  select role into v_role from public.profiles where id = v_caller;
  if v_role is distinct from 'admin' then raise exception 'No autorizado'; end if;
  if not exists (select 1 from public.profiles where id = p_user) then raise exception 'Usuario no encontrado'; end if;
  update public.profiles
    set role = p_role,
        status = case when p_role = 'player' then 'pending'::public.user_status
                      else 'active'::public.user_status end,
        cashier_id = null
    where id = p_user;
  if p_role = 'cashier' then
    insert into public.cashier_accounts (cashier_id) values (p_user) on conflict (cashier_id) do nothing;
  end if;
end $$;
