import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./supabase/config";
import type { PropertyStatus } from "./property-types";

/**
 * Lecture d'un bien publié, pour la page publique (visiteur non connecté).
 * Passe uniquement par la fonction get_public_property, qui ne renvoie
 * que les informations publiques.
 */

export type PublicProperty = {
  title: string;
  kind: string;
  status: PropertyStatus;
  city: string;
  postalCode: string | null;
  price: number | null;
  surface: number | null;
  rooms: number | null;
  bedrooms: number | null;
  floor: string | null;
  dpe: string | null;
  ges: string | null;
  annualCharges: number | null;
  description: string | null;
  reference: string | null;
  agencyName: string;
  agentName: string | null;
  agentPhone: string | null;
  photos: string[];
};

export function anonClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Mis en cache le temps d'une requête : les métadonnées et la page ne comptent qu'une seule vue. */
export const getPublicProperty = cache(async (slug: string): Promise<PublicProperty | null> => {
  if (!isSupabaseConfigured || !/^[a-z0-9-]{6,120}$/.test(slug)) return null;
  const supabase = anonClient();
  const { data, error } = await supabase.rpc("get_public_property", { p_slug: slug });
  if (error || !data) return null;

  const raw = data as Omit<PublicProperty, "photos" | "surface"> & { photos: string[]; surface: number | string | null };
  let photos: string[] = [];
  if (raw.photos.length > 0) {
    const { data: signed } = await supabase.storage.from("property-photos").createSignedUrls(raw.photos, 60 * 60 * 6);
    const byPath = new Map((signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl]));
    photos = raw.photos.map((p) => byPath.get(p)).filter((u): u is string => Boolean(u));
  }
  return { ...raw, surface: raw.surface === null ? null : Number(raw.surface), photos };
});
