import type { BadgeTone } from "@/components/ui/badge";

/**
 * Données d'exemple, en attendant la base de données (Supabase).
 * Les prix sont volontairement laissés vides.
 */

export type PropertyStatus = "en-ligne" | "a-publier" | "offre" | "compromis" | "brouillon";

export const STATUS_LABEL: Record<PropertyStatus, { label: string; tone: BadgeTone }> = {
  "en-ligne": { label: "En ligne", tone: "success" },
  "a-publier": { label: "À publier", tone: "warning" },
  offre: { label: "Offre reçue", tone: "brand" },
  compromis: { label: "Compromis", tone: "neutral" },
  brouillon: { label: "Brouillon", tone: "neutral" },
};

export type Property = {
  id: string;
  ref: string;
  title: string;
  city: string;
  surface: number;
  rooms: number;
  bedrooms: number;
  floor: string;
  dpe: string;
  ges: string;
  price: number | null;
  status: PropertyStatus;
  views: number | null;
  requests: number | null;
  visits: number | null;
  mandate: "Exclusif" | "Simple";
  mandateEnd: string;
  extras: string;
  annexes: string;
  description: string;
  tint: string;
};

export const PROPERTIES: Property[] = [
  {
    id: "t3-lyon6",
    ref: "IMM-2026-041",
    title: "T3 lumineux avec balcon",
    city: "Lyon 6e",
    surface: 68,
    rooms: 3,
    bedrooms: 2,
    floor: "4e sur 5 · ascenseur",
    dpe: "C",
    ges: "B",
    price: null,
    status: "en-ligne",
    views: 412,
    requests: 23,
    visits: 5,
    mandate: "Exclusif",
    mandateEnd: "12/02/2027",
    extras: "Balcon 6 m²",
    annexes: "Cave",
    description:
      "Au cœur du 6e arrondissement, à deux pas du parc de la Tête d'Or, ce T3 traversant de 68 m² bénéficie d'une belle luminosité tout au long de la journée. Le séjour s'ouvre sur un balcon exposé sud. Deux chambres au calme côté cour, une cuisine équipée et une cave complètent ce bien prêt à vivre.",
    tint: "#DCE6FF",
  },
  {
    id: "maison-ecully",
    ref: "IMM-2026-044",
    title: "Maison des Tilleuls",
    city: "Écully",
    surface: 140,
    rooms: 6,
    bedrooms: 4,
    floor: "Plain-pied + étage",
    dpe: "B",
    ges: "A",
    price: null,
    status: "a-publier",
    views: null,
    requests: null,
    visits: null,
    mandate: "Exclusif",
    mandateEnd: "30/03/2027",
    extras: "Jardin 600 m²",
    annexes: "Garage double",
    description: "Description en cours de génération par le Studio IA.",
    tint: "#FDE7C8",
  },
  {
    id: "studio-villeurbanne",
    ref: "IMM-2026-037",
    title: "Studio rénové",
    city: "Villeurbanne",
    surface: 24,
    rooms: 1,
    bedrooms: 0,
    floor: "2e sur 4",
    dpe: "D",
    ges: "C",
    price: null,
    status: "offre",
    views: 689,
    requests: 31,
    visits: 9,
    mandate: "Simple",
    mandateEnd: "15/01/2027",
    extras: "—",
    annexes: "Cave",
    description: "Studio entièrement rénové, idéal premier achat ou investissement locatif.",
    tint: "#D3F0E2",
  },
  {
    id: "loft-lyon7",
    ref: "IMM-2026-029",
    title: "Loft atelier",
    city: "Lyon 7e",
    surface: 95,
    rooms: 3,
    bedrooms: 2,
    floor: "RDC sur cour",
    dpe: "C",
    ges: "C",
    price: null,
    status: "compromis",
    views: 1208,
    requests: 54,
    visits: 11,
    mandate: "Exclusif",
    mandateEnd: "01/12/2026",
    extras: "Verrière",
    annexes: "—",
    description: "Ancien atelier transformé en loft lumineux sous verrière.",
    tint: "#FBDCD2",
  },
  {
    id: "t2-croix-rousse",
    ref: "IMM-2026-046",
    title: "T2 Croix-Rousse",
    city: "Lyon 4e",
    surface: 45,
    rooms: 2,
    bedrooms: 1,
    floor: "3e sans ascenseur",
    dpe: "D",
    ges: "D",
    price: null,
    status: "en-ligne",
    views: 236,
    requests: 12,
    visits: 3,
    mandate: "Simple",
    mandateEnd: "20/04/2027",
    extras: "—",
    annexes: "—",
    description: "T2 typique canut, hauts plafonds et poutres apparentes.",
    tint: "#E4E7EC",
  },
];

export function getProperty(id: string) {
  return PROPERTIES.find((p) => p.id === id);
}

export const AGENDA = [
  { time: "10:00", title: "Visite · T3 Lyon 6e", who: "M. et Mme Martin", kind: "visite" as const },
  { time: "14:30", title: "Estimation · Caluire", who: "Mme Durand", kind: "estimation" as const },
  { time: "17:00", title: "Contre-visite · Loft Lyon 7e", who: "M. Benali", kind: "visite" as const },
];

export const TODOS = [
  "Rappeler Julie R. (budget 320 k€)",
  "Envoyer le rapport hebdo à M. Petit",
  "Relancer les diagnostics du studio",
];

export const BUYERS = [
  { initials: "MM", name: "M. et Mme Martin", meta: "Prêt accordé · budget compatible", score: "Prioritaire", tone: "success" as BadgeTone },
  { initials: "JR", name: "Julie R.", meta: "Accord de principe bancaire", score: "Qualifié", tone: "warning" as BadgeTone },
  { initials: "KB", name: "Karim B.", meta: "Vente de son bien en cours", score: "Qualifié", tone: "warning" as BadgeTone },
  { initials: "LP", name: "Léa P.", meta: "Financement non étudié", score: "À qualifier", tone: "neutral" as BadgeTone },
];

export const CURRENT_USER = {
  firstName: "Camille",
  fullName: "Camille Laurent",
  initials: "CL",
  agency: "Agence du Parc",
  plan: "pro" as const,
  trialDaysLeft: 9,
  trialDays: 14,
};
