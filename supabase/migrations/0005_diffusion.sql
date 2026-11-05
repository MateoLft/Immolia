-- =====================================================================
-- Immolia — Suivi de la diffusion des annonces sur les portails
-- À exécuter UNIQUEMENT dans le projet Supabase « immolia ».
-- =====================================================================

create table public.property_listings (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id() references public.agencies (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  portal text not null check (portal ~ '^[a-z0-9-]{2,40}$'),
  status text not null default 'publie' check (status in ('publie', 'retire')),
  listing_url text check (listing_url is null or listing_url ~ '^https?://'),
  published_at timestamptz not null default now(),
  removed_at timestamptz,
  unique (property_id, portal)
);
create index property_listings_property_idx on public.property_listings (property_id);

alter table public.property_listings enable row level security;

create policy "diffusions : agence" on public.property_listings
  for all to authenticated
  using (agency_id = (select public.current_agency_id()))
  with check (agency_id = (select public.current_agency_id()));
