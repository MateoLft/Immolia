"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPortal } from "@/lib/portals";

type Result = { ok: true } | { ok: false; error: string };

export async function setListingStatus(propertyId: string, portalId: string, published: boolean, url?: string): Promise<Result> {
  if (!getPortal(portalId)) return { ok: false, error: "Portail inconnu." };
  if (!isSupabaseConfigured) return { ok: false, error: "Indisponible en mode démo." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return { ok: false, error: "Session expirée, reconnectez-vous." };

  const cleanUrl = url?.trim();
  if (cleanUrl && !/^https?:\/\/\S+$/.test(cleanUrl)) return { ok: false, error: "Le lien de l'annonce doit commencer par https://" };

  const now = new Date().toISOString();
  const { error } = await supabase.from("property_listings").upsert(
    {
      property_id: propertyId,
      portal: portalId,
      status: published ? "publie" : "retire",
      ...(published ? { published_at: now, removed_at: null } : { removed_at: now }),
      ...(cleanUrl !== undefined ? { listing_url: cleanUrl || null } : {}),
    },
    { onConflict: "property_id,portal" },
  );
  if (error) return { ok: false, error: "L'enregistrement a échoué. Le script 0005 a-t-il été exécuté dans Supabase ?" };

  revalidatePath(`/app/biens/${propertyId}`);
  revalidatePath(`/app/biens/${propertyId}/diffuser`);
  return { ok: true };
}
