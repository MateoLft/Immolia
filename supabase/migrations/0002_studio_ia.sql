-- =====================================================================
-- Immolia — Studio IA : contenus générés pour les biens
-- À exécuter UNIQUEMENT dans le projet Supabase « immolia ».
-- =====================================================================

create table public.generated_contents (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id() references public.agencies (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  kind text not null check (kind in ('annonce', 'annonce-courte', 'instagram', 'facebook')),
  tone text not null check (tone in ('chaleureux', 'premium', 'dynamique')),
  content text not null,
  model text,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);
create index generated_contents_property_idx on public.generated_contents (property_id, kind, created_at desc);
create index generated_contents_agency_month_idx on public.generated_contents (agency_id, created_at);

alter table public.generated_contents enable row level security;

create policy "contenus IA : agence" on public.generated_contents
  for all to authenticated
  using (agency_id = (select public.current_agency_id()))
  with check (agency_id = (select public.current_agency_id()));
