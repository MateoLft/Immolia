-- =====================================================================
-- Immolia — Module Équipe : invitations, rôles et désactivation d'agents
-- À exécuter UNIQUEMENT dans le projet Supabase « immolia », après 0008.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Membres actifs / désactivés
-- ---------------------------------------------------------------------
alter table public.profiles add column active boolean not null default true;
alter table public.profiles add column email text;
update public.profiles p set email = u.email from auth.users u where u.id = p.id;

-- Un membre désactivé n'a plus accès à aucune donnée de l'agence.
create or replace function public.current_agency_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select agency_id from public.profiles where id = (select auth.uid()) and active
$$;

create function public.current_member_role()
returns public.member_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid()) and active
$$;

-- ---------------------------------------------------------------------
-- Protection des rôles : seul le responsable (owner) modifie les rôles et
-- les accès, jamais les siens ; un membre ne peut pas s'attribuer de droits.
-- ---------------------------------------------------------------------
create function public.protect_profile_fields()
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

create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Le responsable peut modifier les membres de son agence (rôle, accès).
create policy "profils : gestion par le responsable" on public.profiles
  for update to authenticated
  using (agency_id = (select public.current_agency_id()) and (select public.current_member_role()) = 'owner')
  with check (agency_id = (select public.current_agency_id()));

-- ---------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------
create table public.agency_invitations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null default public.current_agency_id() references public.agencies (id) on delete cascade,
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role public.member_role not null default 'agent' check (role in ('agent', 'manager')),
  token text not null unique check (length(token) >= 32),
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  revoked_at timestamptz
);
create index agency_invitations_agency_idx on public.agency_invitations (agency_id, created_at desc);

alter table public.agency_invitations enable row level security;
create policy "invitations : lecture responsables" on public.agency_invitations
  for select to authenticated
  using (agency_id = (select public.current_agency_id()) and (select public.current_member_role()) in ('owner', 'manager'));
create policy "invitations : création responsables" on public.agency_invitations
  for insert to authenticated
  with check (
    agency_id = (select public.current_agency_id())
    and (select public.current_member_role()) in ('owner', 'manager')
    -- un manager ne peut inviter que des agents
    and (role = 'agent' or (select public.current_member_role()) = 'owner')
  );
create policy "invitations : annulation responsables" on public.agency_invitations
  for update to authenticated
  using (agency_id = (select public.current_agency_id()) and (select public.current_member_role()) in ('owner', 'manager'))
  with check (agency_id = (select public.current_agency_id()));

-- Infos d'une invitation pour la page d'inscription (visiteur non connecté).
create function public.get_invitation(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'agencyName', a.name,
    'email', i.email,
    'role', i.role,
    'valid', i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
  )
  from public.agency_invitations i
  join public.agencies a on a.id = i.agency_id
  where i.token = p_token
$$;
revoke all on function public.get_invitation(text) from public;
grant execute on function public.get_invitation(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Inscription : rejoindre l'agence qui a invité, ou créer sa propre agence
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_agency_id uuid;
  inv record;
begin
  select * into inv
  from public.agency_invitations
  where token = new.raw_user_meta_data ->> 'invitation_token'
    and lower(email) = lower(new.email)
    and accepted_at is null and revoked_at is null and expires_at > now()
  for update;

  if inv.id is not null then
    insert into public.profiles (id, agency_id, full_name, role, email)
    values (new.id, inv.agency_id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), inv.role, new.email);
    update public.agency_invitations set accepted_at = now() where id = inv.id;
    return new;
  end if;

  insert into public.agencies (name)
  values (coalesce(nullif(new.raw_user_meta_data ->> 'agency_name', ''), 'Mon agence'))
  returning id into new_agency_id;

  insert into public.profiles (id, agency_id, full_name, role, email)
  values (new.id, new_agency_id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'owner', new.email);

  insert into public.subscriptions (agency_id) values (new_agency_id);
  return new;
end;
$$;
