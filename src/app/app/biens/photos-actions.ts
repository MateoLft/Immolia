"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const BUCKET = "property-photos";
const MAX_PHOTOS = 30;

type Result = { ok: true } | { ok: false; error: string };

async function session() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ? supabase : null;
}

/** Infos nécessaires au navigateur pour envoyer une photo dans le bon dossier. */
export async function preparePhotoUpload(propertyId: string): Promise<{ ok: true; folder: string; remaining: number } | { ok: false; error: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: "L'ajout de photos n'est pas disponible en mode démo." };
  const supabase = await session();
  if (!supabase) return { ok: false, error: "Session expirée, reconnectez-vous." };

  const { data: property } = await supabase.from("properties").select("id, agency_id").eq("id", propertyId).maybeSingle();
  if (!property) return { ok: false, error: "Bien introuvable." };

  const { count } = await supabase.from("property_photos").select("id", { count: "exact", head: true }).eq("property_id", propertyId);
  return { ok: true, folder: `${property.agency_id}/${property.id}`, remaining: Math.max(0, MAX_PHOTOS - (count ?? 0)) };
}

/** Enregistre en base les photos déjà envoyées dans le stockage. */
export async function registerPhotos(propertyId: string, paths: string[]): Promise<Result> {
  const supabase = await session();
  if (!supabase) return { ok: false, error: "Session expirée, reconnectez-vous." };

  const { data: property } = await supabase.from("properties").select("id, agency_id").eq("id", propertyId).maybeSingle();
  if (!property) return { ok: false, error: "Bien introuvable." };

  const prefix = `${property.agency_id}/${property.id}/`;
  const valid = paths.filter((p) => p.startsWith(prefix) && !p.includes(".."));
  if (valid.length === 0) return { ok: false, error: "Aucune photo valide." };

  const { data: last } = await supabase
    .from("property_photos")
    .select("position")
    .eq("property_id", propertyId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = (last?.position ?? -1) + 1;

  const { error } = await supabase
    .from("property_photos")
    .insert(valid.map((storage_path, i) => ({ property_id: propertyId, storage_path, position: start + i })));
  if (error) return { ok: false, error: "L'enregistrement des photos a échoué." };

  revalidatePath(`/app/biens/${propertyId}`);
  return { ok: true };
}

export async function deletePhoto(photoId: string): Promise<Result> {
  const supabase = await session();
  if (!supabase) return { ok: false, error: "Session expirée, reconnectez-vous." };

  const { data: photo } = await supabase.from("property_photos").select("id, property_id, storage_path").eq("id", photoId).maybeSingle();
  if (!photo) return { ok: false, error: "Photo introuvable." };

  await supabase.storage.from(BUCKET).remove([photo.storage_path]);
  const { error } = await supabase.from("property_photos").delete().eq("id", photoId);
  if (error) return { ok: false, error: "La suppression a échoué." };

  revalidatePath(`/app/biens/${photo.property_id}`);
  return { ok: true };
}

/** Place une photo en premier (photo principale) et décale les autres. */
export async function setCoverPhoto(photoId: string): Promise<Result> {
  const supabase = await session();
  if (!supabase) return { ok: false, error: "Session expirée, reconnectez-vous." };

  const { data: photo } = await supabase.from("property_photos").select("id, property_id").eq("id", photoId).maybeSingle();
  if (!photo) return { ok: false, error: "Photo introuvable." };

  const { data: all } = await supabase.from("property_photos").select("id").eq("property_id", photo.property_id).order("position");
  const ordered = [photoId, ...(all ?? []).map((p) => p.id).filter((id) => id !== photoId)];

  const results = await Promise.all(ordered.map((id, position) => supabase.from("property_photos").update({ position }).eq("id", id)));
  if (results.some((r) => r.error)) return { ok: false, error: "Le changement de photo principale a échoué." };

  revalidatePath(`/app/biens/${photo.property_id}`);
  return { ok: true };
}
