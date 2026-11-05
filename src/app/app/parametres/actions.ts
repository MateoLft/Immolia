"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type SettingsState = { ok?: boolean; error?: string };

export async function saveSettings(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  if (!isSupabaseConfigured) return { error: "Indisponible en mode démo." };
  const get = (k: string) => String(form.get(k) ?? "").trim();

  const fullName = get("full_name");
  const agencyName = get("agency_name");
  if (!fullName) return { error: "Indiquez votre nom." };
  if (get("phone").length > 30 || get("agency_phone").length > 30) return { error: "Numéro de téléphone trop long." };
  if (get("fee_text").length > 500) return { error: "Mention honoraires trop longue (500 caractères maximum)." };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { error: "Session expirée, reconnectez-vous." };

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: get("phone") || null })
    .eq("id", userId)
    .select("agency_id, role")
    .single();
  if (pErr || !profile) return { error: "L'enregistrement du profil a échoué." };

  if (profile.role === "owner" || profile.role === "manager") {
    if (!agencyName) return { error: "Indiquez le nom de l'agence." };
    const { error } = await supabase
      .from("agencies")
      .update({
        name: agencyName,
        address: get("agency_address") || null,
        phone: get("agency_phone") || null,
        email: get("agency_email") || null,
        professional_card: get("professional_card") || null,
        siren: get("siren") || null,
        fee_text: get("fee_text") || null,
      })
      .eq("id", profile.agency_id);
    if (error) return { error: "L'enregistrement de l'agence a échoué. Le script 0006 a-t-il été exécuté dans Supabase ?" };
  }

  revalidatePath("/app", "layout");
  return { ok: true };
}
