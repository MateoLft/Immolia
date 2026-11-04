/**
 * Source unique des offres Immolia.
 * Le site vitrine (tarifs, tableau comparatif) et les droits d'accès
 * dans le logiciel lisent tous ce fichier.
 */

export type PlanId = "essentiel" | "pro" | "agence";

export const PLAN_ORDER: PlanId[] = ["essentiel", "pro", "agence"];

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Prix mensuel HT en euros */
  monthly: number;
  /** Prix mensuel HT équivalent en paiement annuel (2 mois offerts) */
  yearlyPerMonth: number;
  seats: number;
  extraSeat?: number;
  highlights: string[];
  cta: string;
  recommended?: boolean;
};

const yearly = (m: number) => Math.round(((m * 10) / 12) * 100) / 100;

export const PLANS: Record<PlanId, Plan> = {
  essentiel: {
    id: "essentiel",
    name: "Essentiel",
    tagline: "Pour les mandataires indépendants.",
    monthly: 39,
    yearlyPerMonth: yearly(39),
    seats: 1,
    highlights: [
      "15 biens générés par mois",
      "Page web et QR code par bien",
      "Agenda de visites et rappels SMS",
      "Bons de visite électroniques",
      "Application mobile",
    ],
    cta: "Commencer l'essai",
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Pour les agents qui veulent accélérer.",
    monthly: 89,
    yearlyPerMonth: yearly(89),
    seats: 1,
    highlights: [
      "Biens illimités",
      "Vidéos courtes automatiques",
      "Retouche photo et home staging",
      "Rapport vendeur automatique",
      "Assistant de qualification des acquéreurs",
      "Widget d'estimation",
    ],
    cta: "Commencer l'essai",
    recommended: true,
  },
  agence: {
    id: "agence",
    name: "Agence",
    tagline: "Jusqu'à 5 agents, puis 29 € par agent.",
    monthly: 199,
    yearlyPerMonth: yearly(199),
    seats: 5,
    extraSeat: 29,
    highlights: [
      "Détection d'opportunités de mandats",
      "Dossier de vente et PV d'AG",
      "Registre des mandats",
      "Contrôles anti-blanchiment",
      "Tableau de bord manager",
    ],
    cta: "Contacter l'équipe",
  },
};

/** Valeur affichée dans le tableau comparatif : true = inclus, false = non inclus, texte = quota */
type Cell = boolean | string;

export const COMPARISON: { feature: string; values: Record<PlanId, Cell> }[] = [
  { feature: "Utilisateurs inclus", values: { essentiel: "1", pro: "1", agence: "5" } },
  { feature: "Biens générés par le Studio IA", values: { essentiel: "15 / mois", pro: "Illimité", agence: "Illimité" } },
  { feature: "Page web et QR code", values: { essentiel: true, pro: true, agence: true } },
  { feature: "Visites et bons de visite", values: { essentiel: true, pro: true, agence: true } },
  { feature: "Vidéos automatiques", values: { essentiel: false, pro: true, agence: true } },
  { feature: "Home staging virtuel", values: { essentiel: false, pro: "20 / mois", agence: "100 / mois" } },
  { feature: "Rapport vendeur", values: { essentiel: false, pro: true, agence: true } },
  { feature: "Assistant acquéreurs IA", values: { essentiel: false, pro: true, agence: true } },
  { feature: "Détection de mandats", values: { essentiel: false, pro: false, agence: true } },
  { feature: "Conformité anti-blanchiment", values: { essentiel: false, pro: false, agence: true } },
];

export function hasPlan(current: PlanId, required: PlanId) {
  return PLAN_ORDER.indexOf(current) >= PLAN_ORDER.indexOf(required);
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}
