import type { BadgeTone } from "@/components/ui/badge";
import { formatEuros, formatNumber, kindLabel, type Property, type PropertyStatus } from "./property-types";

/** Acquéreurs : types, libellés et rapprochement avec les biens (partagé serveur / navigateur). */

export type BuyerScore = "prioritaire" | "qualifie" | "a-qualifier";
export type BuyerStatus = "actif" | "achete" | "abandonne";

export type BuyerFull = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  budgetMax: number | null;
  financing: string | null;
  score: BuyerScore;
  notes: string | null;
  cities: string[];
  kinds: string[];
  minSurface: number | null;
  minRooms: number | null;
  status: BuyerStatus;
  source: string | null;
  createdAt: string;
};

export const SCORE_LABEL: Record<BuyerScore, { label: string; tone: BadgeTone }> = {
  prioritaire: { label: "Prioritaire", tone: "success" },
  qualifie: { label: "Qualifié", tone: "warning" },
  "a-qualifier": { label: "À qualifier", tone: "neutral" },
};

export const BUYER_STATUS_LABEL: Record<BuyerStatus, string> = {
  actif: "En recherche",
  achete: "A acheté",
  abandonne: "Recherche abandonnée",
};

/** Biens proposables à un acquéreur. */
const MATCHABLE: PropertyStatus[] = ["a-publier", "en-ligne", "offre"];

/** Marge de négociation tolérée sur le budget (un bien à 5 % au-dessus reste proposé). */
const BUDGET_MARGIN = 1.05;

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function matches(b: BuyerFull, p: Property) {
  if (b.status !== "actif" || !MATCHABLE.includes(p.status)) return false;
  if (b.budgetMax && p.price && p.price > b.budgetMax * BUDGET_MARGIN) return false;
  if (b.kinds.length > 0 && !b.kinds.includes(p.kind)) return false;
  if (b.minSurface && p.surface && p.surface < b.minSurface) return false;
  if (b.minRooms && p.rooms && p.rooms < b.minRooms) return false;
  if (b.cities.length > 0) {
    const place = norm(`${p.city} ${p.postalCode ?? ""}`);
    if (!b.cities.some((c) => place.includes(norm(c)))) return false;
  }
  return true;
}

export function criteriaSummary(b: BuyerFull) {
  const parts = [
    b.kinds.length ? b.kinds.map(kindLabel).join(" / ") : null,
    b.cities.length ? b.cities.join(", ") : null,
    b.budgetMax ? `jusqu'à ${formatEuros(b.budgetMax)}` : null,
    b.minSurface ? `${formatNumber(b.minSurface)} m² min.` : null,
    b.minRooms ? `${b.minRooms} pièces min.` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Critères non renseignés";
}

/** Numéro français vers le format international pour WhatsApp (06… → 336…). */
export function whatsappNumber(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `33${digits.slice(1)}`;
  return digits;
}

export function propertyPitch(p: Property, link: string | null, firstName: string) {
  const facts = [kindLabel(p.kind), p.rooms ? `${p.rooms} pièces` : null, p.surface ? `${formatNumber(p.surface)} m²` : null, p.city]
    .filter(Boolean)
    .join(", ");
  return [
    `Bonjour ${firstName},`,
    "",
    `Un bien correspond à votre recherche : ${p.title} (${facts}${p.price ? `, ${formatEuros(p.price)}` : ""}).`,
    link ? `Découvrez-le ici : ${link}` : "",
    "",
    "Souhaitez-vous le visiter ? Je reste à votre disposition.",
  ]
    .filter((l, i, arr) => l !== "" || arr[i - 1] !== "")
    .join("\n");
}
