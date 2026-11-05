"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { MANDATE_TYPES } from "@/lib/property-types";

export type MandateFormState = { error?: string; values?: Record<string, string> };
const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

async function session() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return userId ? { supabase, userId } : null;
}

export async function createMandate(_prev: MandateFormState, form: FormData): Promise<MandateFormState> {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const values = Object.fromEntries(
    [...form.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")).map(([k, v]) => [k, String(v)]),
  );

  const type = MANDATE_TYPES.find((t) => t.value === get("type"))?.value;
  if (!type) return { error: "Choisissez le type de mandat.", values };
  if (!isDate(get("signed_on"))) return { error: "Indiquez la date de signature.", values };
  if (get("ends_on") && !isDate(get("ends_on"))) return { error: "Date de fin invalide.", values };
  if (get("ends_on") && get("ends_on") < get("signed_on")) return { error: "La date de fin doit être après la signature.", values };
  const price = get("price") ? Number(get("price").replace(/\s/g, "")) : null;
  if (price !== null && (!Number.isFinite(price) || price < 0)) return { error: "Prix invalide.", values };

  const s = await session();
  if (!s) return { error: "Indisponible en mode démo ou session expirée.", values };
  const { supabase, userId } = s;

  // Mandant : vendeur existant ou nom saisi.
  let sellerId = isUuid(get("seller_id")) ? get("seller_id") : null;
  let sellerName = get("seller_name");
  if (sellerId) {
    const { data } = await supabase.from("sellers").select("full_name").eq("id", sellerId).maybeSingle();
    if (!data) return { error: "Vendeur introuvable.", values };
    sellerName = data.full_name;
  } else if (sellerName) {
    const { data, error } = await supabase.from("sellers").insert({ full_name: sellerName }).select("id").single();
    if (error || !data) return { error: "La création du vendeur a échoué. Le script 0006 a-t-il été exécuté ?", values };
    sellerId = data.id;
  } else {
    return { error: "Indiquez le mandant (vendeur).", values };
  }

  // Bien : existant ou désignation libre.
  const propertyId = isUuid(get("property_id")) ? get("property_id") : null;
  let propertyLabel = get("property_label");
  if (propertyId) {
    const { data } = await supabase.from("properties").select("title, city, address").eq("id", propertyId).maybeSingle();
    if (!data) return { error: "Bien introuvable.", values };
    propertyLabel = [data.title, data.address, data.city].filter(Boolean).join(", ");
  }
  if (!propertyLabel) return { error: "Choisissez le bien ou décrivez-le.", values };

  const { data: mandate, error } = await supabase
    .from("mandates")
    .insert({
      property_id: propertyId,
      seller_id: sellerId,
      seller_name: sellerName,
      property_label: propertyLabel,
      type,
      signed_on: get("signed_on"),
      ends_on: get("ends_on") || null,
      price_eur: price === null ? null : Math.round(price),
      fee_text: get("fee_text") || null,
      notes: get("notes") || null,
      created_by: userId,
    })
    .select("number")
    .single();
  if (error || !mandate) return { error: "L'inscription au registre a échoué. Le script 0006 a-t-il été exécuté ?", values };

  if (propertyId) {
    await supabase
      .from("properties")
      .update({ mandate_type: type, mandate_end: get("ends_on") || null, seller_id: sellerId, reference: `M-${mandate.number}` })
      .eq("id", propertyId)
      .is("reference", null);
    await supabase.from("properties").update({ mandate_type: type, mandate_end: get("ends_on") || null, seller_id: sellerId }).eq("id", propertyId);
    // Le vendeur n'est plus un simple prospect.
    await supabase.from("sellers").update({ is_prospect: false }).eq("id", sellerId);
  }
  redirect("/app/mandats");
}

export async function setMandateStatus(id: string, status: "en-cours" | "vendu" | "expire" | "resilie") {
  const s = await session();
  if (!s) return { ok: false as const, error: "Indisponible en mode démo ou session expirée." };
  const { error } = await s.supabase.from("mandates").update({ status }).eq("id", id);
  if (error) return { ok: false as const, error: "La mise à jour a échoué." };
  revalidatePath("/app/mandats");
  return { ok: true as const };
}
