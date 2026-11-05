import type { PlanId } from "./plans";

/**
 * Liste de tous les modules du logiciel.
 * Chaque module a sa page dans /app, même ceux qui ne sont pas encore développés :
 * ils affichent un écran « en préparation » jusqu'à leur livraison.
 * Voir ROADMAP.md pour l'ordre de développement.
 */

export type ModuleStatus = "disponible" | "en-cours" | "prevu";

export type AppModule = {
  slug: string;
  name: string;
  description: string;
  plan: PlanId;
  status: ModuleStatus;
  section: "pilotage" | "outils";
};

export const MODULES: AppModule[] = [
  { slug: "biens", name: "Biens", description: "Fiches complètes, photos, documents et historique de chaque bien.", plan: "essentiel", status: "en-cours", section: "pilotage" },
  { slug: "visites", name: "Visites", description: "Agenda, réservation en ligne, rappels SMS et bons de visite signés.", plan: "essentiel", status: "en-cours", section: "pilotage" },
  { slug: "acquereurs", name: "Acquéreurs", description: "Fiches acquéreurs, score de qualification et assistant IA 24h/24.", plan: "pro", status: "prevu", section: "pilotage" },
  { slug: "vendeurs", name: "Vendeurs", description: "Suivi des vendeurs et rapport hebdomadaire automatique.", plan: "pro", status: "prevu", section: "pilotage" },
  { slug: "mandats", name: "Mandats", description: "Registre des mandats, alertes d'échéance et détection d'opportunités.", plan: "agence", status: "prevu", section: "pilotage" },
  { slug: "estimations", name: "Estimations", description: "Widget d'estimation à votre marque et rapports PDF.", plan: "pro", status: "prevu", section: "pilotage" },
  { slug: "dossiers", name: "Dossiers de vente", description: "Collecte des pièces, relances et analyse des PV d'AG par l'IA.", plan: "agence", status: "prevu", section: "pilotage" },
  { slug: "studio", name: "Studio IA", description: "Annonces, posts réseaux sociaux, vidéos et plaquettes PDF.", plan: "essentiel", status: "en-cours", section: "outils" },
  { slug: "conformite", name: "Conformité", description: "Contrôles anti-blanchiment (LCB-FT) et pièces justificatives.", plan: "agence", status: "prevu", section: "outils" },
  { slug: "equipe", name: "Équipe", description: "Agents, rôles et tableau de bord manager.", plan: "agence", status: "prevu", section: "outils" },
  { slug: "parametres", name: "Paramètres", description: "Profil, marque (logo, couleurs), abonnement et factures.", plan: "essentiel", status: "prevu", section: "outils" },
];

export function getModule(slug: string) {
  return MODULES.find((m) => m.slug === slug);
}
