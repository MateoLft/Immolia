"use server";

import { answerVisitorQuestion, type ChatTurn } from "@/lib/ai";
import { anonClient } from "@/lib/public-property";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatEuros, kindLabel } from "@/lib/property-types";

const MAX_TURNS = 12;
const MAX_CHARS = 500;

export async function askAssistant(slug: string, turns: ChatTurn[]): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  if (!isSupabaseConfigured || !/^[a-z0-9-]{6,120}$/.test(slug)) return { ok: false, error: "Assistant indisponible." };
  const clean = (turns ?? [])
    .filter((t) => (t.role === "user" || t.role === "assistant") && typeof t.text === "string")
    .slice(-MAX_TURNS)
    .map((t) => ({ role: t.role, text: t.text.slice(0, MAX_CHARS) }));
  if (clean.length === 0 || clean[clean.length - 1].role !== "user" || clean[0].role !== "user") return { ok: false, error: "Question invalide." };
  if (turns.filter((t) => t.role === "user").length > MAX_TURNS / 2 + 1) {
    return { ok: true, text: "Pour aller plus loin, le plus simple est d'échanger directement avec l'agent : utilisez le formulaire « Demander une visite »." };
  }

  const supabase = anonClient();
  const { data: allowed } = await supabase.rpc("bump_assistant_usage", { p_slug: slug });
  if (allowed !== true) return { ok: false, error: "L'assistant n'est plus disponible aujourd'hui pour ce bien. Contactez directement l'agence." };

  const { data } = await supabase.rpc("get_public_property_info", { p_slug: slug });
  if (!data) return { ok: false, error: "Annonce introuvable." };
  const p = data as Record<string, string | number | null>;
  const listing = {
    Titre: p.title,
    "Type de bien": typeof p.kind === "string" ? kindLabel(p.kind) : null,
    Statut: p.status === "vendu" ? "vendu" : p.status === "offre" || p.status === "compromis" ? "sous offre" : "disponible",
    Ville: [p.postalCode, p.city].filter(Boolean).join(" "),
    Prix: typeof p.price === "number" ? formatEuros(p.price) : null,
    Surface: p.surface ? `${p.surface} m²` : null,
    Pièces: p.rooms,
    Chambres: p.bedrooms,
    Étage: p.floor,
    DPE: p.dpe,
    GES: p.ges,
    "Charges annuelles": typeof p.annualCharges === "number" ? formatEuros(p.annualCharges) : null,
    Honoraires: p.feeText,
    Description: p.description,
    Agence: p.agencyName,
    Agent: p.agentName,
    "Téléphone de l'agent": p.agentPhone,
  };
  return answerVisitorQuestion(listing, clean);
}
