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
      "Agenda de visites et rappels en un clic",
      "Bons de visite signés sur écran",
      "Utilisable sur mobile et tablette",
    ],
    cta: "Commencer l'essai",
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Pour les agents qui veulent tout automatiser.",
    monthly: 69,
    yearlyPerMonth: yearly(69),
    seats: 1,
    highlights: [
      "Biens illimités",
      "Acquéreurs, vendeurs et prospects, avec rapprochement automatique",
      "Dossier de vente et analyse des PV d'AG par l'IA",
      "Registre des mandats",
      "Assistant IA 24h/24 sur vos annonces",
      "Estimations, plaquettes PDF et vidéos courtes",
    ],
    cta: "Commencer l'essai",
    recommended: true,
  },
  agence: {
    id: "agence",
    name: "Agence",
    tagline: "Jusqu'à 5 agents, puis 29 € par agent.",
    monthly: 139,
    yearlyPerMonth: yearly(139),
    seats: 5,
    extraSeat: 29,
    highlights: [
      "Jusqu'à 5 agents inclus",
      "Invitations et rôles (responsable, manager, agent)",
      "Tableau de bord manager par agent",
      "Attribution des biens aux agents",
      "Contrôles anti-blanchiment (bientôt)",
    ],
    cta: "Contacter l'équipe",
  },
};

/** Valeur affichée dans le tableau comparatif : true = inclus, false = non inclus, texte = quota */
type Cell = boolean | string;

export const COMPARISON: { feature: string; values: Record<PlanId, Cell> }[] = [
  { feature: "Utilisateurs inclus", values: { essentiel: "1", pro: "1", agence: "5" } },
  { feature: "Biens générés par le Studio IA", values: { essentiel: "15 / mois", pro: "Illimité", agence: "Illimité" } },
  { feature: "Page web, QR code et diffusion assistée", values: { essentiel: true, pro: true, agence: true } },
  { feature: "Visites et bons de visite signés", values: { essentiel: true, pro: true, agence: true } },
  { feature: "Acquéreurs et rapprochement automatique", values: { essentiel: false, pro: true, agence: true } },
  { feature: "Vendeurs, prospects et rapport hebdomadaire", values: { essentiel: false, pro: true, agence: true } },
  { feature: "Registre des mandats", values: { essentiel: false, pro: true, agence: true } },
  { feature: "Dossier de vente : analyses de documents par l'IA", values: { essentiel: false, pro: "30 / mois", agence: "100 / mois" } },
  { feature: "Assistant IA sur les annonces", values: { essentiel: false, pro: true, agence: true } },
  { feature: "Estimations, plaquettes PDF et vidéos courtes", values: { essentiel: false, pro: true, agence: true } },
  { feature: "Équipe, rôles et tableau de bord manager", values: { essentiel: false, pro: false, agence: true } },
  { feature: "Conformité anti-blanchiment", values: { essentiel: false, pro: false, agence: "Bientôt" } },
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
