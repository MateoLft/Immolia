-- =====================================================================
-- Immolia — Dossiers de vente, estimations, bons de visite signés,
-- assistant IA des pages publiques
-- À exécuter UNIQUEMENT dans le projet Supabase « immolia ».
-- =====================================================================

-- ---------------------------------------------------------------------
-- Dossier de vente : documents d'un bien (stockage privé)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-documents', 'property-documents', false, 20971520, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "documents stockage : lecture agence" on storage.objects
  for select to authenticated
  using (bucket_id = 'property-documents' and (storage.foldername(name))[1] = (select public.current_agency_id())::text);
create policy "documents stockage : ajout agence" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-documents' and (storage.foldername(name))[1] = (select public.current_agency_id())::text);
create policy "documents stockage : suppression agence" on storage.objects
  for delete to authenticated
  using (bucket_id = 'property-documents' and (storage.foldername(name))[1] = (select public.current_agency_id())::text);

create table public.property_documents (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id() references public.agencies (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  kind text not null check (kind ~ '^[a-z0-9-]{2,40}$'),
  file_name text not null,
  storage_path text not null check (split_part(storage_path, '/', 1) = agency_id::text),
  analysis text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index property_documents_property_idx on public.property_documents (property_id, kind);

alter table public.property_documents enable row level security;
create policy "documents : agence" on public.property_documents
  for all to authenticated
  using (agency_id = (select public.current_agency_id()))
  with check (agency_id = (select public.current_agency_id()));

-- ---------------------------------------------------------------------
-- Bon de visite signé
-- ---------------------------------------------------------------------
alter table public.visits
  add column voucher_signer_name text,
  add column voucher_signature_path text;

-- ---------------------------------------------------------------------
-- Estimations : formulaire public de l'agence + avis de valeur
-- ---------------------------------------------------------------------
alter table public.agencies add column public_slug text unique
  check (public_slug is null or public_slug ~ '^[a-z0-9-]{3,80}$');

create table public.estimation_requests (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  seller_id uuid references public.sellers (id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  property_type text not null,
  address text,
  city text not null,
  surface_m2 numeric(8, 2),
  rooms smallint,
  message text,
  status text not null default 'nouvelle' check (status in ('nouvelle', 'en-cours', 'envoyee', 'archivee')),
  price_low integer,
  price_high integer,
  comment text,
  created_at timestamptz not null default now()
);
create index estimation_requests_agency_idx on public.estimation_requests (agency_id, status, created_at desc);

alter table public.estimation_requests enable row level security;
create policy "estimations : agence" on public.estimation_requests
  for all to authenticated
  using (agency_id = (select public.current_agency_id()))
  with check (agency_id = (select public.current_agency_id()));

-- Infos publiques de l'agence pour la page d'estimation.
create function public.get_public_agency(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('name', a.name, 'phone', a.phone, 'email', a.email)
  from public.agencies a where a.public_slug = p_slug
$$;

-- Demande d'estimation par un propriétaire (crée aussi un prospect vendeur).
create function public.submit_estimation_request(
  p_slug text, p_name text, p_email text, p_phone text,
  p_type text, p_address text, p_city text, p_surface numeric, p_rooms int, p_message text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  ag uuid;
  seller uuid;
begin
  select id into ag from public.agencies where public_slug = p_slug;
  if ag is null then return false; end if;
  if coalesce(length(trim(p_name)), 0) = 0 or length(p_name) > 120 then return false; end if;
  if coalesce(length(trim(p_email)), 0) = 0 and coalesce(length(trim(p_phone)), 0) = 0 then return false; end if;
  if coalesce(length(trim(p_city)), 0) = 0 or length(p_city) > 120 then return false; end if;
  if length(coalesce(p_email, '')) > 200 or length(coalesce(p_phone, '')) > 40 or length(coalesce(p_address, '')) > 300
     or length(coalesce(p_message, '')) > 2000 or length(coalesce(p_type, '')) > 40 then
    return false;
  end if;
  -- Anti-abus : 3 demandes par heure et par contact, 50 par jour et par agence.
  if (select count(*) from public.estimation_requests
      where agency_id = ag and created_at > now() - interval '1 hour'
        and (lower(email) = lower(nullif(trim(p_email), '')) or phone = nullif(trim(p_phone), ''))) >= 3
     or (select count(*) from public.estimation_requests where agency_id = ag and created_at > now() - interval '1 day') >= 50 then
    return false;
  end if;

  insert into public.sellers (agency_id, full_name, email, phone, address, is_prospect, next_contact_on, notes)
  values (ag, trim(p_name), nullif(trim(p_email), ''), nullif(trim(p_phone), ''), nullif(trim(p_address), ''), true, current_date,
          'Demande d''estimation reçue en ligne')
  returning id into seller;

  insert into public.estimation_requests (agency_id, seller_id, full_name, email, phone, property_type, address, city, surface_m2, rooms, message)
  values (ag, seller, trim(p_name), nullif(trim(p_email), ''), nullif(trim(p_phone), ''), coalesce(nullif(trim(p_type), ''), 'appartement'),
          nullif(trim(p_address), ''), trim(p_city), p_surface, p_rooms, nullif(trim(p_message), ''));
  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- Assistant IA des pages publiques : plafond de messages par bien et par jour
-- ---------------------------------------------------------------------
create table public.assistant_usage (
  property_id uuid not null references public.properties (id) on delete cascade,
  day date not null default current_date,
  messages integer not null default 0,
  primary key (property_id, day)
);
alter table public.assistant_usage enable row level security; -- aucun accès direct

create function public.bump_assistant_usage(p_slug text)
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
  return used <= 200;  -- plafond fixe : un visiteur ne peut pas le modifier
end;
$$;

-- Infos publiques d'un bien pour l'assistant (sans compter de vue).
create function public.get_public_property_info(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'title', p.title, 'kind', p.property_type, 'status', p.status, 'city', p.city, 'postalCode', p.postal_code,
    'price', p.price_eur, 'surface', p.surface_m2, 'rooms', p.rooms, 'bedrooms', p.bedrooms, 'floor', p.floor,
    'dpe', p.dpe, 'ges', p.ges, 'annualCharges', p.annual_charges_eur, 'description', p.public_description,
    'agencyName', a.name, 'agentName', pr.full_name, 'agentPhone', pr.phone, 'feeText', a.fee_text
  )
  from public.properties p
  join public.agencies a on a.id = p.agency_id
  left join public.profiles pr on pr.id = p.agent_id
  where p.public_slug = p_slug and p.published and p.status not in ('archive', 'brouillon')
$$;

revoke all on function public.get_public_property_info(text) from public;
grant execute on function public.get_public_property_info(text) to anon, authenticated;

revoke all on function public.get_public_agency(text) from public;
revoke all on function public.submit_estimation_request(text, text, text, text, text, text, text, numeric, int, text) from public;
revoke all on function public.bump_assistant_usage(text) from public;
grant execute on function public.get_public_agency(text) to anon, authenticated;
grant execute on function public.submit_estimation_request(text, text, text, text, text, text, text, numeric, int, text) to anon, authenticated;
grant execute on function public.bump_assistant_usage(text) to anon, authenticated;
