-- =====================================================================
-- Immolia — Paramètres d'agence, critères acquéreurs, vendeurs, mandats
-- À exécuter UNIQUEMENT dans le projet Supabase « immolia ».
-- =====================================================================

-- ---------------------------------------------------------------------
-- Paramètres de l'agence
-- ---------------------------------------------------------------------
alter table public.agencies
  add column address text,
  add column phone text,
  add column email text,
  add column professional_card text,      -- numéro de carte professionnelle (loi Hoguet)
  add column fee_text text,               -- mention honoraires par défaut dans les annonces
  add column siren text;

-- ---------------------------------------------------------------------
-- Critères de recherche des acquéreurs (rapprochement automatique)
-- ---------------------------------------------------------------------
alter table public.buyers
  add column cities text[] not null default '{}',
  add column kinds text[] not null default '{}',
  add column min_surface_m2 numeric(8, 2),
  add column min_rooms smallint,
  add column status text not null default 'actif' check (status in ('actif', 'achete', 'abandonne'));

-- ---------------------------------------------------------------------
-- Vendeurs
-- ---------------------------------------------------------------------
create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id() references public.agencies (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  address text,
  notes text,
  is_prospect boolean not null default false,  -- prospect vendeur (pas encore de mandat)
  next_contact_on date,
  created_at timestamptz not null default now()
);
create index sellers_agency_idx on public.sellers (agency_id, full_name);

alter table public.sellers enable row level security;
create policy "vendeurs : agence" on public.sellers
  for all to authenticated
  using (agency_id = (select public.current_agency_id()))
  with check (agency_id = (select public.current_agency_id()));

alter table public.properties add column seller_id uuid references public.sellers (id) on delete set null;
create index properties_seller_idx on public.properties (seller_id);

-- ---------------------------------------------------------------------
-- Registre des mandats (numérotation continue par agence, sans suppression)
-- ---------------------------------------------------------------------
create table public.mandates (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id() references public.agencies (id) on delete cascade,
  number integer not null,
  property_id uuid references public.properties (id) on delete set null,
  seller_id uuid references public.sellers (id) on delete set null,
  -- Copie figée des informations au jour de l'inscription au registre.
  seller_name text not null,
  property_label text not null,
  type public.mandate_type not null,
  signed_on date not null,
  ends_on date,
  price_eur integer,
  fee_text text,
  status text not null default 'en-cours' check (status in ('en-cours', 'vendu', 'expire', 'resilie')),
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (agency_id, number)
);
create index mandates_agency_idx on public.mandates (agency_id, number desc);

create function public.assign_mandate_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext('mandates:' || new.agency_id::text));
  select coalesce(max(number), 0) + 1 into new.number from public.mandates where agency_id = new.agency_id;
  return new;
end;
$$;

create trigger mandates_number before insert on public.mandates
  for each row execute function public.assign_mandate_number();

-- Le numéro et l'agence ne peuvent pas être modifiés après coup.
create function public.protect_mandate_number()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.number <> old.number or new.agency_id <> old.agency_id then
    raise exception 'Le numéro d''un mandat inscrit au registre ne peut pas être modifié';
  end if;
  return new;
end;
$$;

create trigger mandates_protect before update on public.mandates
  for each row execute function public.protect_mandate_number();

alter table public.mandates enable row level security;
-- Lecture, ajout et mise à jour par l'agence ; aucune suppression (registre).
create policy "mandats : lecture agence" on public.mandates
  for select to authenticated using (agency_id = (select public.current_agency_id()));
create policy "mandats : ajout agence" on public.mandates
  for insert to authenticated with check (agency_id = (select public.current_agency_id()));
create policy "mandats : mise à jour agence" on public.mandates
  for update to authenticated
  using (agency_id = (select public.current_agency_id()))
  with check (agency_id = (select public.current_agency_id()));
