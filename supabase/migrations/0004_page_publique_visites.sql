-- =====================================================================
-- Immolia — Page publique des biens et demandes de visite
-- À exécuter UNIQUEMENT dans le projet Supabase « immolia ».
--
-- Sécurité : les visiteurs (non connectés) n'ont AUCUN accès direct aux
-- tables. Ils passent par deux fonctions qui ne renvoient que les
-- informations publiques d'un bien publié (jamais l'adresse exacte ni les
-- notes internes) et qui enregistrent les demandes de visite.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Publication d'un bien
-- ---------------------------------------------------------------------
alter table public.properties
  add column published boolean not null default false,
  add column public_slug text unique,
  add column public_description text,
  add column published_at timestamptz;

alter table public.properties
  add constraint properties_slug_format check (public_slug is null or public_slug ~ '^[a-z0-9-]{6,120}$');

-- ---------------------------------------------------------------------
-- Demandes de visite envoyées depuis la page publique
-- ---------------------------------------------------------------------
alter table public.buyers add column source text;

create table public.visit_requests (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  message text,
  availability text,
  status text not null default 'nouvelle' check (status in ('nouvelle', 'planifiee', 'archivee')),
  buyer_id uuid references public.buyers (id) on delete set null,
  created_at timestamptz not null default now()
);
create index visit_requests_agency_idx on public.visit_requests (agency_id, status, created_at desc);
create index visit_requests_property_idx on public.visit_requests (property_id, created_at desc);

alter table public.visit_requests enable row level security;

create policy "demandes de visite : agence" on public.visit_requests
  for all to authenticated
  using (agency_id = (select public.current_agency_id()))
  with check (agency_id = (select public.current_agency_id()));

-- ---------------------------------------------------------------------
-- Lecture publique d'un bien publié (compte aussi une vue)
-- ---------------------------------------------------------------------
create function public.get_public_property(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
  prop_id uuid;
begin
  select p.id,
         jsonb_build_object(
           'title', p.title,
           'kind', p.property_type,
           'status', p.status,
           'city', p.city,
           'postalCode', p.postal_code,
           'price', p.price_eur,
           'surface', p.surface_m2,
           'rooms', p.rooms,
           'bedrooms', p.bedrooms,
           'floor', p.floor,
           'dpe', p.dpe,
           'ges', p.ges,
           'annualCharges', p.annual_charges_eur,
           'description', p.public_description,
           'reference', p.reference,
           'agencyName', a.name,
           'agentName', pr.full_name,
           'agentPhone', pr.phone,
           'photos', coalesce((
             select jsonb_agg(ph.storage_path order by ph.position)
             from public.property_photos ph
             where ph.property_id = p.id
           ), '[]'::jsonb)
         )
    into prop_id, result
  from public.properties p
  join public.agencies a on a.id = p.agency_id
  left join public.profiles pr on pr.id = p.agent_id
  where p.public_slug = p_slug
    and p.published
    and p.status not in ('archive', 'brouillon');

  if prop_id is null then
    return null;
  end if;

  update public.properties set views_count = views_count + 1 where id = prop_id;
  return result;
end;
$$;

-- ---------------------------------------------------------------------
-- Envoi d'une demande de visite par un visiteur
-- ---------------------------------------------------------------------
create function public.submit_visit_request(
  p_slug text,
  p_name text,
  p_email text,
  p_phone text,
  p_message text,
  p_availability text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  prop record;
begin
  if coalesce(length(trim(p_name)), 0) = 0 or length(p_name) > 120 then return false; end if;
  if coalesce(length(trim(p_email)), 0) = 0 and coalesce(length(trim(p_phone)), 0) = 0 then return false; end if;
  if length(coalesce(p_email, '')) > 200 or length(coalesce(p_phone, '')) > 40
     or length(coalesce(p_message, '')) > 2000 or length(coalesce(p_availability, '')) > 300 then
    return false;
  end if;

  select id, agency_id into prop
  from public.properties
  where public_slug = p_slug and published and status not in ('archive', 'brouillon');
  if prop.id is null then return false; end if;

  -- Anti-abus : 3 demandes par heure et par contact, 30 par heure et par bien.
  if (select count(*) from public.visit_requests
      where property_id = prop.id and created_at > now() - interval '1 hour'
        and (lower(email) = lower(nullif(trim(p_email), '')) or phone = nullif(trim(p_phone), ''))) >= 3
     or (select count(*) from public.visit_requests
         where property_id = prop.id and created_at > now() - interval '1 hour') >= 30 then
    return false;
  end if;

  insert into public.visit_requests (agency_id, property_id, full_name, email, phone, message, availability)
  values (prop.agency_id, prop.id, trim(p_name), nullif(trim(p_email), ''), nullif(trim(p_phone), ''),
          nullif(trim(p_message), ''), nullif(trim(p_availability), ''));
  return true;
end;
$$;

-- Une photo est publique si elle appartient à un bien publié.
create function public.is_public_photo(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.property_photos ph
    join public.properties p on p.id = ph.property_id
    where ph.storage_path = p_path and p.published and p.status not in ('archive', 'brouillon')
  )
$$;

revoke all on function public.get_public_property(text) from public;
revoke all on function public.submit_visit_request(text, text, text, text, text, text) from public;
revoke all on function public.is_public_photo(text) from public;
grant execute on function public.get_public_property(text) to anon, authenticated;
grant execute on function public.submit_visit_request(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.is_public_photo(text) to anon, authenticated;

-- Les visiteurs peuvent afficher les photos des biens publiés (et seulement celles-là).
create policy "photos stockage : lecture publique des biens publiés" on storage.objects
  for select to anon
  using (bucket_id = 'property-photos' and public.is_public_photo(name));
