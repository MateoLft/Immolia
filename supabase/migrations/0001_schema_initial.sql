-- =====================================================================
-- Immolia — schéma initial
-- À exécuter UNIQUEMENT dans le projet Supabase « immolia »
-- (vérifier le nom du projet en haut à gauche avant de lancer).
--
-- Principe de sécurité : chaque table est rattachée à une agence, et les
-- règles RLS (Row Level Security) garantissent qu'un utilisateur ne voit
-- et ne modifie que les données de sa propre agence.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------
create type public.plan_id as enum ('essentiel', 'pro', 'agence');
create type public.member_role as enum ('owner', 'manager', 'agent');
create type public.property_status as enum ('brouillon', 'a-publier', 'en-ligne', 'offre', 'compromis', 'vendu', 'archive');
create type public.mandate_type as enum ('simple', 'exclusif', 'semi-exclusif');
create type public.visit_status as enum ('prevue', 'realisee', 'annulee');
create type public.buyer_score as enum ('prioritaire', 'qualifie', 'a-qualifier');

-- ---------------------------------------------------------------------
-- Agences et membres
-- ---------------------------------------------------------------------
create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  brand_color text default '#4654F0',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  agency_id uuid not null references public.agencies (id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.member_role not null default 'agent',
  created_at timestamptz not null default now()
);
create index profiles_agency_idx on public.profiles (agency_id);

-- Abonnement de l'agence. Écrit uniquement par le serveur (webhooks Stripe),
-- jamais directement par le navigateur.
create table public.subscriptions (
  agency_id uuid primary key references public.agencies (id) on delete cascade,
  plan public.plan_id not null default 'pro',
  status text not null default 'trialing',
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  current_period_end timestamptz,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  updated_at timestamptz not null default now()
);

-- Agence de l'utilisateur connecté (utilisée par toutes les règles RLS).
create function public.current_agency_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select agency_id from public.profiles where id = (select auth.uid())
$$;

-- ---------------------------------------------------------------------
-- Biens
-- ---------------------------------------------------------------------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id() references public.agencies (id) on delete cascade,
  agent_id uuid references public.profiles (id) on delete set null,
  reference text,
  title text not null,
  property_type text not null default 'appartement',
  status public.property_status not null default 'brouillon',
  address text,
  city text not null default '',
  postal_code text,
  price_eur integer check (price_eur is null or price_eur >= 0),
  surface_m2 numeric(8, 2) check (surface_m2 is null or surface_m2 > 0),
  rooms smallint,
  bedrooms smallint,
  floor text,
  dpe char(1) check (dpe is null or dpe in ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  ges char(1) check (ges is null or ges in ('A', 'B', 'C', 'D', 'E', 'F', 'G')),
  annual_charges_eur integer,
  description text,
  mandate_type public.mandate_type,
  mandate_end date,
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index properties_agency_idx on public.properties (agency_id, status);

create table public.property_photos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  agency_id uuid not null default public.current_agency_id() references public.agencies (id) on delete cascade,
  storage_path text not null,
  position smallint not null default 0,
  caption text,
  created_at timestamptz not null default now()
);
create index property_photos_property_idx on public.property_photos (property_id, position);

-- ---------------------------------------------------------------------
-- Acquéreurs et visites
-- ---------------------------------------------------------------------
create table public.buyers (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id() references public.agencies (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  budget_max_eur integer,
  financing text,
  score public.buyer_score not null default 'a-qualifier',
  notes text,
  created_at timestamptz not null default now()
);
create index buyers_agency_idx on public.buyers (agency_id);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id() references public.agencies (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  buyer_id uuid references public.buyers (id) on delete set null,
  agent_id uuid references public.profiles (id) on delete set null,
  starts_at timestamptz not null,
  status public.visit_status not null default 'prevue',
  voucher_signed_at timestamptz,
  feedback text,
  created_at timestamptz not null default now()
);
create index visits_agency_idx on public.visits (agency_id, starts_at);
create index visits_property_idx on public.visits (property_id);

-- ---------------------------------------------------------------------
-- Mise à jour automatique de updated_at
-- ---------------------------------------------------------------------
create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger properties_touch before update on public.properties
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Inscription : création automatique de l'agence, du profil et de l'essai
-- ---------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_agency_id uuid;
begin
  insert into public.agencies (name)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'agency_name', ''), 'Mon agence'))
  returning id into new_agency_id;

  insert into public.profiles (id, agency_id, full_name, role)
  values (new.id, new_agency_id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'owner');

  insert into public.subscriptions (agency_id) values (new_agency_id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Règles de sécurité (RLS)
-- ---------------------------------------------------------------------
alter table public.agencies enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.properties enable row level security;
alter table public.property_photos enable row level security;
alter table public.buyers enable row level security;
alter table public.visits enable row level security;

-- Agence : lecture par ses membres, modification par le propriétaire ou un manager.
create policy "agence : lecture membres" on public.agencies
  for select to authenticated using (id = (select public.current_agency_id()));
create policy "agence : modification responsables" on public.agencies
  for update to authenticated
  using (
    id = (select public.current_agency_id())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('owner', 'manager'))
  );

-- Profils : chacun voit ceux de son agence et ne modifie que le sien.
create policy "profils : lecture agence" on public.profiles
  for select to authenticated using (agency_id = (select public.current_agency_id()));
create policy "profils : modification de soi" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and agency_id = (select public.current_agency_id()));

-- Abonnement : lecture seule pour les membres (écriture réservée au serveur).
create policy "abonnement : lecture membres" on public.subscriptions
  for select to authenticated using (agency_id = (select public.current_agency_id()));

-- Données métier : accès complet limité à l'agence de l'utilisateur.
create policy "biens : agence" on public.properties
  for all to authenticated
  using (agency_id = (select public.current_agency_id()))
  with check (agency_id = (select public.current_agency_id()));

create policy "photos : agence" on public.property_photos
  for all to authenticated
  using (agency_id = (select public.current_agency_id()))
  with check (agency_id = (select public.current_agency_id()));

create policy "acquereurs : agence" on public.buyers
  for all to authenticated
  using (agency_id = (select public.current_agency_id()))
  with check (agency_id = (select public.current_agency_id()));

create policy "visites : agence" on public.visits
  for all to authenticated
  using (agency_id = (select public.current_agency_id()))
  with check (agency_id = (select public.current_agency_id()));
