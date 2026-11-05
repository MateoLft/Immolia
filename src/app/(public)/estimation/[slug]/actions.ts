"use server";

import { anonClient } from "@/lib/public-property";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PROPERTY_KINDS } from "@/lib/property-types";

export type EstimationFormState = { ok?: boolean; error?: string; values?: Record<string, string> };

export async function sendEstimationRequest(slug: string, _prev: EstimationFormState, form: FormData): Promise<EstimationFormState> {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const values = Object.fromEntries(["name", "email", "phone", "kind", "address", "city", "surface", "rooms", "message"].map((k) => [k, get(k)]));
  if (get("website")) return { ok: true }; // champ invisible rempli par les robots

  if (!values.name) return { error: "Indiquez votre nom.", values };
  if (!values.email && !values.phone) return { error: "Indiquez un email ou un téléphone.", values };
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return { error: "L'adresse email semble incorrecte.", values };
  if (!values.city) return { error: "Indiquez la ville du bien.", values };
  const surface = values.surface ? Number(values.surface.replace(",", ".")) : null;
  const rooms = values.rooms ? Number(values.rooms) : null;
  if ((surface !== null && (!Number.isFinite(surface) || surface <= 0 || surface > 100000)) || (rooms !== null && (!Number.isInteger(rooms) || rooms < 0 || rooms > 100))) {
    return { error: "Vérifiez la surface et le nombre de pièces.", values };
  }
  if (!form.get("consent")) return { error: "Merci d'accepter la transmission de vos coordonnées à l'agence.", values };
  if (!isSupabaseConfigured) return { error: "Service indisponible pour le moment.", values };

  const { data, error } = await anonClient().rpc("submit_estimation_request", {
    p_slug: slug,
    p_name: values.name,
    p_email: values.email,
    p_phone: values.phone,
    p_type: PROPERTY_KINDS.some((k) => k.value === values.kind) ? values.kind : "appartement",
    p_address: values.address,
    p_city: values.city,
    p_surface: surface,
    p_rooms: rooms,
    p_message: values.message,
  });
  if (error || data !== true) return { error: "La demande n'a pas pu être envoyée. Réessayez plus tard ou contactez directement l'agence.", values };
  return { ok: true };
}
