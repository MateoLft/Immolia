"use server";

import { anonClient } from "@/lib/public-property";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type VisitRequestState = { ok?: boolean; error?: string; values?: Record<string, string> };

export async function sendVisitRequest(slug: string, _prev: VisitRequestState, form: FormData): Promise<VisitRequestState> {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const values = { name: get("name"), email: get("email"), phone: get("phone"), message: get("message"), availability: get("availability") };

  // Champ invisible : rempli uniquement par les robots.
  if (get("website")) return { ok: true };

  if (!values.name) return { error: "Indiquez votre nom.", values };
  if (!values.email && !values.phone) return { error: "Indiquez un email ou un téléphone pour être recontacté.", values };
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return { error: "L'adresse email semble incorrecte.", values };
  if (!form.get("consent")) return { error: "Merci d'accepter la transmission de vos coordonnées à l'agence.", values };
  if (!isSupabaseConfigured) return { error: "Demande indisponible pour le moment.", values };

  const { data, error } = await anonClient().rpc("submit_visit_request", {
    p_slug: slug,
    p_name: values.name,
    p_email: values.email,
    p_phone: values.phone,
    p_message: values.message,
    p_availability: values.availability,
  });
  if (error || data !== true) {
    return { error: "La demande n'a pas pu être envoyée. Réessayez plus tard ou contactez directement l'agence.", values };
  }
  return { ok: true };
}
