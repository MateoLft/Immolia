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
  { slug: "biens", name: "Biens", description: "Fiches complètes, photos, documents et historique de chaque bien.", plan: "essentiel", status: "disponible", section: "pilotage" },
  { slug: "visites", name: "Visites", description: "Agenda, demandes de visite en ligne, rappels en un clic et bons de visite signés sur écran.", plan: "essentiel", status: "disponible", section: "pilotage" },
  { slug: "acquereurs", name: "Acquéreurs", description: "Critères de recherche, rapprochement automatique avec vos biens et assistant IA sur vos annonces.", plan: "pro", status: "disponible", section: "pilotage" },
  { slug: "vendeurs", name: "Vendeurs", description: "Suivi des vendeurs et des prospects, rapport hebdomadaire prêt à envoyer.", plan: "pro", status: "disponible", section: "pilotage" },
  { slug: "mandats", name: "Mandats", description: "Registre des mandats numéroté, alertes d'échéance et relances des prospects vendeurs.", plan: "pro", status: "disponible", section: "pilotage" },
  { slug: "estimations", name: "Estimations", description: "Widget d'estimation à votre marque et rapports PDF.", plan: "pro", status: "disponible", section: "pilotage" },
  { slug: "dossiers", name: "Dossiers de vente", description: "Collecte des pièces, relances et analyse des PV d'AG par l'IA.", plan: "pro", status: "disponible", section: "pilotage" },
  { slug: "studio", name: "Studio IA", description: "Annonces, posts réseaux sociaux, vidéos courtes et plaquettes PDF.", plan: "essentiel", status: "disponible", section: "outils" },
  { slug: "conformite", name: "Conformité", description: "Contrôles anti-blanchiment (LCB-FT) et pièces justificatives. Bientôt disponible.", plan: "agence", status: "prevu", section: "outils" },
  { slug: "equipe", name: "Équipe", description: "Invitations d'agents, rôles et tableau de bord manager.", plan: "agence", status: "disponible", section: "outils" },
  { slug: "parametres", name: "Paramètres", description: "Profil, marque (logo, couleurs), abonnement et factures.", plan: "essentiel", status: "disponible", section: "outils" },
];

export function getModule(slug: string) {
  return MODULES.find((m) => m.slug === slug);
}
