"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ENERGY_CLASSES, MANDATE_TYPES, PROPERTY_KINDS, PROPERTY_STATUSES } from "@/lib/property-types";

export type PropertyFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Valeurs saisies, renvoyées pour ne pas vider le formulaire en cas d'erreur. */
  values?: Record<string, string>;
};

const str = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : v;
};

function int(f: FormData, k: string, errors: Record<string, string>, { min = 0, max = 1_000_000_000 } = {}) {
  const raw = str(f, k);
  if (raw === null) return null;
  const n = Number(raw.replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < min || n > max) {
    errors[k] = "Valeur invalide";
    return null;
  }
  return Math.round(n);
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

type ParsedForm =
  | { ok: true; row: Record<string, unknown>; values: Record<string, string> }
  | { ok: false; state: PropertyFormState };

function parsePropertyForm(form: FormData): ParsedForm {
  const values = Object.fromEntries(
    [...form.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")).map(([k, v]) => [k, String(v)]),
  );

  const errors: Record<string, string> = {};
  const title = str(form, "title");
  const city = str(form, "city");
  if (!title) errors.title = "Le titre est obligatoire";
  if (!city) errors.city = "La ville est obligatoire";

  const surfaceRaw = str(form, "surface");
  const surface = surfaceRaw === null ? null : Number(surfaceRaw.replace(",", "."));
  if (surface !== null && (!Number.isFinite(surface) || surface <= 0 || surface > 100_000)) errors.surface = "Surface invalide";

  const row = {
    title,
    city,
    property_type: oneOf(str(form, "kind"), PROPERTY_KINDS.map((k) => k.value)) ?? "appartement",
    status: oneOf(str(form, "status"), PROPERTY_STATUSES) ?? "brouillon",
    address: str(form, "address"),
    postal_code: str(form, "postal_code"),
    reference: str(form, "reference"),
    price_eur: int(form, "price", errors),
    surface_m2: surface,
    rooms: int(form, "rooms", errors, { max: 100 }),
    bedrooms: int(form, "bedrooms", errors, { max: 100 }),
    floor: str(form, "floor"),
    dpe: oneOf(str(form, "dpe"), ENERGY_CLASSES),
    ges: oneOf(str(form, "ges"), ENERGY_CLASSES),
    annual_charges_eur: int(form, "charges", errors),
    mandate_type: oneOf(str(form, "mandate_type"), MANDATE_TYPES.map((m) => m.value)),
    mandate_end: str(form, "mandate_end"),
    description: str(form, "description"),
  };
  // Lien vers le vendeur (ajouté seulement s'il est renseigné ou explicitement retiré).
  const sellerId = str(form, "seller_id");
  if (sellerId && /^[0-9a-f-]{36}$/i.test(sellerId)) Object.assign(row, { seller_id: sellerId });
  else if (form.get("seller_id") === "none") Object.assign(row, { seller_id: null });

  if (Object.keys(errors).length > 0) {
    return { ok: false, state: { error: "Merci de corriger les champs indiqués.", fieldErrors: errors, values } };
  }
  if (!isSupabaseConfigured) {
    return { ok: false, state: { error: "L'enregistrement n'est pas disponible en mode démo.", values } };
  }
  return { ok: true, row, values };
}

async function requireUser() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/connexion");
  return { supabase, userId };
}

export async function createProperty(_prev: PropertyFormState, form: FormData): Promise<PropertyFormState> {
  const parsed = parsePropertyForm(form);
  if (!parsed.ok) return parsed.state;

  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("properties")
    .insert({ ...parsed.row, agent_id: userId })
    .select("id")
    .single();

  if (error || !data) return { error: "L'enregistrement a échoué, merci de réessayer.", values: parsed.values };
  redirect(`/app/biens/${data.id}`);
}

/** Mise à jour d'un bien existant (l'identifiant est lié côté serveur via .bind). */
export async function updateProperty(id: string, _prev: PropertyFormState, form: FormData): Promise<PropertyFormState> {
  const parsed = parsePropertyForm(form);
  if (!parsed.ok) return parsed.state;

  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("properties").update(parsed.row).eq("id", id).select("id").maybeSingle();

  if (error || !data) return { error: "L'enregistrement a échoué, merci de réessayer.", values: parsed.values };
  redirect(`/app/biens/${id}`);
}
