"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { IMPORT_MAX_BYTES, parseImport, type ImportRow, type Problem } from "@/lib/csv-import";

export type ImportPreview =
  | { ok: false; error: string }
  | {
      ok: true;
      total: number;
      /** Références déjà présentes dans votre portefeuille : ces lignes seront ignorées. */
      existing: number;
      recognized: { header: string; field: string }[];
      ignored: string[];
      sample: Pick<ImportRow, "title" | "city" | "property_type" | "price_eur" | "surface_m2" | "status">[];
      errors: Problem[];
      warnings: Problem[];
    };

export type ImportResult = { ok: true; imported: number; skipped: number } | { ok: false; error: string };

async function session() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return userId ? { supabase, userId } : null;
}

type Supa = NonNullable<Awaited<ReturnType<typeof session>>>["supabase"];

/** Références du fichier qui existent déjà dans l'agence (en minuscules). */
async function existingReferences(supabase: Supa, rows: ImportRow[]): Promise<Set<string>> {
  const refs = [...new Set(rows.map((r) => r.reference).filter((r): r is string => Boolean(r)))];
  const found = new Set<string>();
  if (refs.length === 0) return found;
  const { data } = await supabase.from("properties").select("reference").in("reference", refs);
  for (const r of data ?? []) if (r.reference) found.add(String(r.reference).toLowerCase());
  return found;
}

function check(text: unknown): string | null {
  if (typeof text !== "string") return "Fichier illisible.";
  if (text.length > IMPORT_MAX_BYTES) return "Fichier trop volumineux (1 Mo maximum).";
  return null;
}

/** Analyse le fichier et montre ce qui sera importé, sans rien enregistrer. */
export async function previewImport(text: string): Promise<ImportPreview> {
  const bad = check(text);
  if (bad) return { ok: false, error: bad };
  const s = await session();
  if (!s) return { ok: false, error: "Indisponible en mode démo ou session expirée." };

  const parsed = parseImport(text);
  if (parsed.fatal) return { ok: false, error: parsed.fatal };
  const existing = await existingReferences(s.supabase, parsed.rows);
  return {
    ok: true,
    total: parsed.rows.length,
    existing: parsed.rows.filter((r) => r.reference && existing.has(r.reference.toLowerCase())).length,
    recognized: parsed.recognized,
    ignored: parsed.ignored,
    sample: parsed.rows.slice(0, 8).map(({ title, city, property_type, price_eur, surface_m2, status }) => ({ title, city, property_type, price_eur, surface_m2, status })),
    errors: parsed.errors.slice(0, 100),
    warnings: parsed.warnings.slice(0, 100),
  };
}

/** Importe les biens du fichier en une seule opération : tout est enregistré, ou rien. */
export async function runImport(text: string): Promise<ImportResult> {
  const bad = check(text);
  if (bad) return { ok: false, error: bad };
  const s = await session();
  if (!s) return { ok: false, error: "Indisponible en mode démo ou session expirée." };

  const parsed = parseImport(text); // relu côté serveur : on ne fait jamais confiance à l'aperçu du navigateur
  if (parsed.fatal) return { ok: false, error: parsed.fatal };

  const existing = await existingReferences(s.supabase, parsed.rows);
  const toInsert = parsed.rows.filter((r) => !(r.reference && existing.has(r.reference.toLowerCase())));
  if (toInsert.length === 0) return { ok: false, error: "Aucun bien à importer : toutes les lignes sont déjà présentes ou invalides." };

  // `line` est le numéro de ligne du fichier (utile à l'aperçu) : ce n'est pas une colonne de la base.
  const rows = toInsert.map((r) => ({ ...r, line: undefined, agent_id: s.userId }));
  const { error } = await s.supabase.from("properties").insert(rows);
  if (error) {
    console.error("Import CSV : échec", error.message);
    return { ok: false, error: "L'import a échoué, aucun bien n'a été ajouté. Vérifiez le fichier et réessayez." };
  }
  revalidatePath("/app/biens");
  revalidatePath("/app");
  return { ok: true, imported: toInsert.length, skipped: parsed.rows.length - toInsert.length };
}
