import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type QuotaResult = { ok: true } | { ok: false; error: string };

/**
 * Réserve une utilisation de l'IA pour l'agence de l'utilisateur connecté.
 * Les plafonds (par jour et par mois) sont appliqués en base : voir `consume_ai_quota`.
 * En mode démo, aucun plafond. Si la fonction n'existe pas encore (migration 0010
 * non appliquée), on laisse passer pour ne pas bloquer l'application, et on le journalise.
 */
export async function consumeAiQuota(kind: "studio" | "document" | "estimation"): Promise<QuotaResult> {
  if (!isSupabaseConfigured) return { ok: true };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consume_ai_quota", { p_kind: kind });
  if (error) {
    console.error("Quota IA indisponible (migration 0010 appliquée ?)", error.message);
    return { ok: true };
  }
  if (data === "ok") return { ok: true };
  if (data === "jour") return { ok: false, error: "Limite quotidienne d'utilisation de l'IA atteinte pour votre agence. Elle sera de nouveau disponible dans 24 heures." };
  if (data === "mois") return { ok: false, error: "Limite mensuelle d'utilisation de l'IA atteinte pour votre agence. Contactez-nous pour l'augmenter." };
  return { ok: false, error: "Utilisation de l'IA non autorisée pour ce compte." };
}
