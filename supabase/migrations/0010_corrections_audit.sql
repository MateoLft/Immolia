-- =====================================================================
-- Immolia — Corrections issues de l'audit
-- À exécuter UNIQUEMENT dans le projet Supabase « immolia », après 0009.
--   1. Notes de préparation d'une visite distinctes du compte rendu
--   2. Interdiction des références entre agences (visites, mandats…)
--   3. Suppression d'un bien réservée au responsable et aux managers
--   4. E-mail du profil non modifiable depuis l'API
--   5. Plafonds d'utilisation de l'IA par agence (jour / mois)
--   6. Statistiques d'équipe calculées en SQL (plus de limite de lignes)
--   7. Changement de photo principale en une seule opération
-- =====================================================================

-- 1. Notes de visite ---------------------------------------------------
alter table public.visits add column notes text;
-- Avant ce correctif, les notes de préparation étaient rangées dans « feedback ».
update public.visits set notes = feedback, feedback = null where status = 'prevue' and feedback is not null;

-- 2. Une ligne ne peut référencer que des éléments de sa propre agence --
create or replace function public.enforce_same_agency()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  i int := 0;
  ref uuid;
  ok boolean;
begin
  while i < TG_NARGS loop
    ref := (to_jsonb(new) ->> TG_ARGV[i])::uuid;
    if ref is not null then
      execute format('select exists (select 1 from public.%I where id = $1 and agency_id = $2)', TG_ARGV[i + 1])
        into ok using ref, new.agency_id;
      if not ok then
        raise exception 'Référence interdite : % appartient à une autre agence', TG_ARGV[i];
      end if;
    end if;
    i := i + 2;
  end loop;
  return new;
end;
$$;

create trigger visits_same_agency before insert or update on public.visits
  for each row execute function public.enforce_same_agency('property_id', 'properties', 'buyer_id', 'buyers');
create trigger generated_contents_same_agency before insert or update on public.generated_contents
  for each row execute function public.enforce_same_agency('property_id', 'properties');
create trigger mandates_same_agency before insert or update on public.mandates
  for each row execute function public.enforce_same_agency('property_id', 'properties', 'seller_id', 'sellers');
create trigger property_documents_same_agency before insert or update on public.property_documents
  for each row execute function public.enforce_same_agency('property_id', 'properties');
create trigger property_photos_same_agency before insert or update on public.property_photos
  for each row execute function public.enforce_same_agency('property_id', 'properties');
create trigger property_listings_same_agency before insert or update on public.property_listings
  for each row execute function public.enforce_same_agency('property_id', 'properties');
create trigger properties_same_agency before insert or update on public.properties
  for each row execute function public.enforce_same_agency('seller_id', 'sellers');

-- 3. Suppression d'un bien : responsable et managers uniquement ----------
drop policy "biens : agence" on public.properties;
create policy "biens : lecture" on public.properties
  for select to authenticated using (agency_id = (select public.current_agency_id()));
create policy "biens : ajout" on public.properties
  for insert to authenticated with check (agency_id = (select public.current_agency_id()));
create policy "biens : modification" on public.properties
  for update to authenticated
  using (agency_id = (select public.current_agency_id()))
  with check (agency_id = (select public.current_agency_id()));
create policy "biens : suppression responsables" on public.properties
  for delete to authenticated
  using (agency_id = (select public.current_agency_id()) and (select public.current_member_role()) in ('owner', 'manager'));

-- 4. L'e-mail du profil suit le compte de connexion -----------------------
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  my_role public.member_role;
  my_agency uuid;
begin
  if me is null then
    return new; -- opérations d'administration (éditeur SQL, fonctions internes)
  end if;
  if new.agency_id <> old.agency_id then
    raise exception 'Changement d''agence interdit';
  end if;
  if new.email is distinct from old.email then
    raise exception 'L''adresse e-mail du profil n''est pas modifiable ici';
  end if;
  if new.role is distinct from old.role or new.active is distinct from old.active then
    select role, agency_id into my_role, my_agency from public.profiles where id = me and active;
    if my_role is distinct from 'owner' or my_agency <> old.agency_id then
      raise exception 'Seul le responsable de l''agence peut modifier les rôles et les accès';
    end if;
    if old.id = me then
      raise exception 'Vous ne pouvez pas modifier votre propre rôle ou accès';
    end if;
  end if;
  return new;
end;
$$;

-- 5. Plafonds d'utilisation de l'IA -------------------------------------
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  kind text not null,
  created_at timestamptz not null default now()
);
create index ai_usage_agency_idx on public.ai_usage (agency_id, created_at desc);
alter table public.ai_usage enable row level security;
create policy "usage IA : lecture agence" on public.ai_usage
  for select to authenticated using (agency_id = (select public.current_agency_id()));
-- Aucune politique d'écriture : seules les fonctions ci-dessous enregistrent l'usage.

-- Réserve une utilisation de l'IA. Renvoie 'ok', 'jour' ou 'mois' (plafond atteint).
-- Plafonds provisoires, communs à toutes les agences ; ils seront modulés par offre.
create or replace function public.consume_ai_quota(p_kind text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  ag uuid := (select public.current_agency_id());
  per_day constant int := 60;
  per_month constant int := 400;
  n_day int;
  n_month int;
begin
  if ag is null then
    return 'refuse';
  end if;
  perform pg_advisory_xact_lock(hashtext(ag::text));
  select count(*) filter (where created_at >= now() - interval '1 day'), count(*)
    into n_day, n_month
    from public.ai_usage
    where agency_id = ag and created_at >= now() - interval '30 days';
  if n_day >= per_day then return 'jour'; end if;
  if n_month >= per_month then return 'mois'; end if;
  insert into public.ai_usage (agency_id, user_id, kind) values (ag, (select auth.uid()), left(p_kind, 40));
  return 'ok';
end;
$$;
revoke all on function public.consume_ai_quota(text) from public, anon;
grant execute on function public.consume_ai_quota(text) to authenticated;

-- 6. Statistiques d'équipe ------------------------------------------------
create or replace function public.get_member_stats()
returns table (agent_id uuid, properties int, upcoming_visits int, visits_month int, mandates_month int, ai_month int)
language sql
stable
security definer
set search_path = ''
as $$
  with ctx as (
    select (select public.current_agency_id()) as ag,
           date_trunc('month', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris' as m
  )
  select k as agent_id, sum(p)::int, sum(uv)::int, sum(vm)::int, sum(mm)::int, sum(am)::int
  from (
    select pr.agent_id as k, 1 as p, 0 as uv, 0 as vm, 0 as mm, 0 as am
      from public.properties pr, ctx where pr.agency_id = ctx.ag and pr.status in ('brouillon', 'a-publier', 'en-ligne', 'offre', 'compromis')
    union all
    select v.agent_id, 0, case when v.status = 'prevue' and v.starts_at > now() then 1 else 0 end,
           case when v.status = 'realisee' and v.starts_at >= ctx.m then 1 else 0 end, 0, 0
      from public.visits v, ctx where v.agency_id = ctx.ag
    union all
    select md.created_by, 0, 0, 0, 1, 0
      from public.mandates md, ctx where md.agency_id = ctx.ag and md.created_at >= ctx.m
    union all
    select gc.created_by, 0, 0, 0, 0, 1
      from public.generated_contents gc, ctx where gc.agency_id = ctx.ag and gc.created_at >= ctx.m
  ) t
  group by k
$$;
revoke all on function public.get_member_stats() from public, anon;
grant execute on function public.get_member_stats() to authenticated;

-- 7. Photo principale : réordonnancement atomique -------------------------
create or replace function public.set_cover_photo(p_photo uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  with target as (select property_id from public.property_photos where id = p_photo),
  ranked as (
    select id, (row_number() over (order by (id = p_photo) desc, position, id) - 1)::int as pos
    from public.property_photos
    where property_id = (select property_id from target)
  )
  update public.property_photos pp set position = ranked.pos from ranked where pp.id = ranked.id;
$$;
grant execute on function public.set_cover_photo(uuid) to authenticated;
