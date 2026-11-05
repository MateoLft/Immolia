import { DEFAULT_FEE_TEXT, formatEuros, formatNumber, kindLabel, type Property } from "./property-types";

/**
 * Portails proposés dans la diffusion assistée.
 * Les limites de longueur sont des valeurs prudentes, à ajuster si un portail change ses règles.
 */
export type Portal = {
  id: string;
  name: string;
  /** Page où l'agent dépose ou gère ses annonces. */
  url: string;
  titleMax: number;
  textMax: number;
  hint: string;
};

export const PORTALS: Portal[] = [
  {
    id: "leboncoin",
    name: "Leboncoin",
    url: "https://www.leboncoin.fr/deposer-une-annonce",
    titleMax: 70,
    textMax: 4000,
    hint: "Connectez-vous avec votre compte pro (Leboncoin Immo Pro), puis déposez l'annonce dans la catégorie « Ventes immobilières ».",
  },
  {
    id: "seloger",
    name: "SeLoger",
    url: "https://www.seloger.com",
    titleMax: 70,
    textMax: 4000,
    hint: "Selon votre abonnement, la saisie se fait dans votre espace professionnel SeLoger ou via votre multidiffuseur.",
  },
  {
    id: "bienici",
    name: "Bien'ici",
    url: "https://www.bienici.com",
    titleMax: 70,
    textMax: 4000,
    hint: "Bien'ici est réservé aux professionnels : la saisie se fait depuis votre espace pro ou votre multidiffuseur.",
  },
  {
    id: "facebook",
    name: "Facebook Marketplace",
    url: "https://www.facebook.com/marketplace/create",
    titleMax: 100,
    textMax: 2000,
    hint: "Choisissez « Location ou vente de logement », puis collez les informations ci-dessous.",
  },
];

export const getPortal = (id: string) => PORTALS.find((p) => p.id === id);

export function cut(text: string, max: number) {
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > max * 0.6 ? lastSpace : slice.length).trimEnd()}…`;
}

/** Titre court et factuel, du type « Appartement 3 pièces 68 m² – Lyon 6e ». */
export function shortTitle(p: Property) {
  return [kindLabel(p.kind), p.rooms ? `${p.rooms} pièce${p.rooms > 1 ? "s" : ""}` : null, p.surface ? `${formatNumber(p.surface)} m²` : null]
    .filter(Boolean)
    .join(" ")
    .concat(` – ${p.city}`);
}

export function portalTitle(p: Property, portal: Portal) {
  return p.title.length <= portal.titleMax ? p.title : cut(shortTitle(p), portal.titleMax);
}

/** Mentions à faire figurer dans l'annonce (DPE, GES, honoraires). */
export function legalMentions(p: Property, feeText: string | null = null) {
  const energy = p.dpe ? `DPE : classe ${p.dpe}${p.ges ? ` – GES : classe ${p.ges}` : ""}.` : "DPE : en cours.";
  const charges = p.annualCharges ? ` Charges de copropriété : ${formatEuros(p.annualCharges)} par an.` : "";
  return `${energy}${charges} ${feeText ?? DEFAULT_FEE_TEXT}`;
}

export function portalText(base: string, p: Property, portal: Portal, feeText: string | null = null) {
  const mentions = legalMentions(p, feeText);
  // Si le texte contient déjà les mentions (annonce du Studio IA), on ne les ajoute pas une deuxième fois.
  const body = /DPE\s*:/i.test(base) ? base.trim() : `${base.trim()}\n\n${mentions}`.trim();
  return cut(body, portal.textMax);
}

export function portalFacts(p: Property): [string, string][] {
  const facts: [string, string | null][] = [
    ["Type de bien", kindLabel(p.kind)],
    ["Prix", p.price ? String(p.price) : null],
    ["Surface habitable (m²)", p.surface ? String(p.surface) : null],
    ["Nombre de pièces", p.rooms ? String(p.rooms) : null],
    ["Nombre de chambres", p.bedrooms !== null ? String(p.bedrooms) : null],
    ["Étage", p.floor],
    ["Classe énergie (DPE)", p.dpe],
    ["GES", p.ges],
    ["Charges annuelles (€)", p.annualCharges ? String(p.annualCharges) : null],
    ["Code postal", p.postalCode],
    ["Ville", p.city],
    ["Référence", p.reference],
  ];
  return facts.filter((f): f is [string, string] => f[1] !== null && f[1] !== "");
}
