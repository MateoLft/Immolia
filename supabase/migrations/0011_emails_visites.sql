-- =====================================================================
-- Immolia — E-mails de visite (confirmation, rappel)
-- À exécuter UNIQUEMENT dans le projet Supabase « immolia », après 0010.
-- =====================================================================

-- Suivi des e-mails envoyés à l'acquéreur pour chaque visite.
alter table public.visits add column last_email_at timestamptz;
alter table public.visits add column email_count smallint not null default 0;

-- Les e-mails ont leur propre plafond : ils ne comptent plus dans celui de l'IA.
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
    where agency_id = ag and kind <> 'email' and created_at >= now() - interval '30 days';
  if n_day >= per_day then return 'jour'; end if;
  if n_month >= per_month then return 'mois'; end if;
  insert into public.ai_usage (agency_id, user_id, kind) values (ag, (select auth.uid()), left(p_kind, 40));
  return 'ok';
end;
$$;
revoke all on function public.consume_ai_quota(text) from public, anon;
grant execute on function public.consume_ai_quota(text) to authenticated;

-- Réserve l'envoi d'un e-mail. Plafonds provisoires : protègent la réputation d'envoi
-- (un compte ne peut pas servir à envoyer du courrier en masse).
create or replace function public.consume_email_quota()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  ag uuid := (select public.current_agency_id());
  per_day constant int := 40;
  per_month constant int := 400;
  n_day int;
  n_month int;
begin
  if ag is null then
    return 'refuse';
  end if;
  perform pg_advisory_xact_lock(hashtext('email:' || ag::text));
  select count(*) filter (where created_at >= now() - interval '1 day'), count(*)
    into n_day, n_month
    from public.ai_usage
    where agency_id = ag and kind = 'email' and created_at >= now() - interval '30 days';
  if n_day >= per_day then return 'jour'; end if;
  if n_month >= per_month then return 'mois'; end if;
  insert into public.ai_usage (agency_id, user_id, kind) values (ag, (select auth.uid()), 'email');
  return 'ok';
end;
$$;
revoke all on function public.consume_email_quota() from public, anon;
grant execute on function public.consume_email_quota() to authenticated;
