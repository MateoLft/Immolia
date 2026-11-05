-- =====================================================================
-- Immolia — Assistant IA : plafond abaissé à 50 messages par jour et par bien
-- À exécuter UNIQUEMENT dans le projet Supabase « immolia », après 0007.
-- =====================================================================

create or replace function public.bump_assistant_usage(p_slug text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  prop uuid;
  used int;
begin
  select id into prop from public.properties
  where public_slug = p_slug and published and status not in ('archive', 'brouillon');
  if prop is null then return false; end if;
  insert into public.assistant_usage (property_id, day, messages) values (prop, current_date, 1)
  on conflict (property_id, day) do update set messages = public.assistant_usage.messages + 1
  returning messages into used;
  return used <= 50;  -- plafond fixe : un visiteur ne peut pas le modifier
end;
$$;
