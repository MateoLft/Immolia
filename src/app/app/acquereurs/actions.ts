"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { FINANCING_OPTIONS, PROPERTY_KINDS } from "@/lib/property-types";

export type BuyerFormState = { error?: string; values?: Record<string, string> };

function parse(form: FormData) {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const num = (k: string) => {
    const v = get(k).replace(/\s/g, "").replace(",", ".");
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : NaN;
  };
  const values = Object.fromEntries(
    [...form.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")).map(([k, v]) => [k, String(v)]),
  );
  const kinds = form.getAll("kinds").map(String).filter((k) => PROPERTY_KINDS.some((x) => x.value === k));
  values.kinds = kinds.join(",");

  const budget = num("budget");
  const surface = num("min_surface");
  const rooms = num("min_rooms");
  if (!get("full_name")) return { error: "Indiquez le nom de l'acquéreur.", values };
  if ([budget, surface, rooms].some((n) => Number.isNaN(n))) return { error: "Vérifiez le budget, la surface et le nombre de pièces.", values };

  const financing = FINANCING_OPTIONS.find((f) => f.value === get("financing"));
  const status = ["actif", "achete", "abandonne"].includes(get("status")) ? get("status") : "actif";
  return {
    values,
    row: {
      full_name: get("full_name"),
      email: get("email") || null,
      phone: get("phone") || null,
      budget_max_eur: budget === null ? null : Math.round(budget),
      min_surface_m2: surface,
      min_rooms: rooms === null ? null : Math.round(rooms),
      cities: get("cities").split(/[,;\n]/).map((c) => c.trim()).filter(Boolean).slice(0, 20),
      kinds,
      notes: get("notes") || null,
      status,
      ...(financing ? { financing: financing.label, score: financing.score } : {}),
    },
  };
}

async function client() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ? supabase : null;
}

export async function createBuyer(_prev: BuyerFormState, form: FormData): Promise<BuyerFormState> {
  const parsed = parse(form);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };
  const supabase = await client();
  if (!supabase) return { error: "Indisponible en mode démo ou session expirée.", values: parsed.values };
  const { data, error } = await supabase.from("buyers").insert({ ...parsed.row, source: "saisie agent" }).select("id").single();
  if (error || !data) return { error: "L'enregistrement a échoué. Le script 0006 a-t-il été exécuté dans Supabase ?", values: parsed.values };
  redirect(`/app/acquereurs/${data.id}`);
}

export async function updateBuyer(id: string, _prev: BuyerFormState, form: FormData): Promise<BuyerFormState> {
  const parsed = parse(form);
  if ("error" in parsed) return { error: parsed.error, values: parsed.values };
  const supabase = await client();
  if (!supabase) return { error: "Indisponible en mode démo ou session expirée.", values: parsed.values };
  const { data, error } = await supabase.from("buyers").update(parsed.row).eq("id", id).select("id").maybeSingle();
  if (error || !data) return { error: "L'enregistrement a échoué.", values: parsed.values };
  redirect(`/app/acquereurs/${id}`);
}
