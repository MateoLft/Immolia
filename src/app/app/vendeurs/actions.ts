"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type SellerFormState = { error?: string; values?: Record<string, string> };

function parse(form: FormData) {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const values = Object.fromEntries(
    [...form.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")).map(([k, v]) => [k, String(v)]),
  );
  if (!get("full_name")) return { error: "Indiquez le nom du vendeur.", values };
  const next = get("next_contact_on");
  if (next && !/^\d{4}-\d{2}-\d{2}$/.test(next)) return { error: "Date de relance invalide.", values };
  return {
    values,
    row: {
      full_name: get("full_name"),
      email: get("email") || null,
      phone: get("phone") || null,
      address: get("address") || null,
      notes: get("notes") || null,
      is_prospect: form.get("is_prospect") === "on",
      next_contact_on: next || null,
    },
  };
}

async function client() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ? supabase : null;
}

export async function createSeller(_prev: SellerFormState, form: FormData): Promise<SellerFormState> {
  const parsed = parse(form);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };
  const supabase = await client();
  if (!supabase) return { error: "Indisponible en mode démo ou session expirée.", values: parsed.values };
  const { data, error } = await supabase.from("sellers").insert(parsed.row).select("id").single();
  if (error || !data) return { error: "L'enregistrement a échoué. Le script 0006 a-t-il été exécuté dans Supabase ?", values: parsed.values };
  redirect(`/app/vendeurs/${data.id}`);
}

export async function updateSeller(id: string, _prev: SellerFormState, form: FormData): Promise<SellerFormState> {
  const parsed = parse(form);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };
  const supabase = await client();
  if (!supabase) return { error: "Indisponible en mode démo ou session expirée.", values: parsed.values };
  const { data, error } = await supabase.from("sellers").update(parsed.row).eq("id", id).select("id").maybeSingle();
  if (error || !data) return { error: "L'enregistrement a échoué.", values: parsed.values };
  redirect(`/app/vendeurs/${id}`);
}
