-- =====================================================================
-- Immolia — Photos des biens (Supabase Storage)
-- À exécuter UNIQUEMENT dans le projet Supabase « immolia ».
--
-- Les photos sont rangées par agence : <id_agence>/<id_bien>/<fichier>.
-- Le dossier est privé : chaque agence ne peut lire, ajouter ou supprimer
-- que les photos de son propre dossier.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-photos', 'property-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "photos stockage : lecture agence" on storage.objects
  for select to authenticated
  using (bucket_id = 'property-photos' and (storage.foldername(name))[1] = (select public.current_agency_id())::text);

create policy "photos stockage : ajout agence" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-photos' and (storage.foldername(name))[1] = (select public.current_agency_id())::text);

create policy "photos stockage : suppression agence" on storage.objects
  for delete to authenticated
  using (bucket_id = 'property-photos' and (storage.foldername(name))[1] = (select public.current_agency_id())::text);

-- Une photo enregistrée doit être rangée dans le dossier de son agence.
alter table public.property_photos
  add constraint property_photos_path_agency check (split_part(storage_path, '/', 1) = agency_id::text);
