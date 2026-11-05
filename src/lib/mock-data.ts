import type { Account, DashboardStats, Property, Visit } from "./property-types";

/**
 * Données d'exemple du « mode démo » (quand Supabase n'est pas configuré,
 * par exemple en développement local sans fichier .env.local).
 */

export const DEMO_ACCOUNT: Account = {
  fullName: "Camille Laurent",
  firstName: "Camille",
  initials: "CL",
  agencyName: "Agence du Parc (démo)",
  plan: "pro",
  subscriptionStatus: "trialing",
  trialDaysLeft: 9,
  trialDays: 14,
  demo: true,
};

const base = {
  address: null,
  postalCode: null,
  price: null,
  annualCharges: null,
  createdAt: "2026-10-20T09:00:00Z",
  coverUrl: null,
};

export const DEMO_PROPERTIES: Property[] = [
  {
    ...base,
    id: "demo-t3-lyon6",
    reference: "IMM-2026-041",
    title: "T3 lumineux avec balcon",
    kind: "appartement",
    status: "en-ligne",
    city: "Lyon 6e",
    surface: 68,
    rooms: 3,
    bedrooms: 2,
    floor: "4e sur 5 · ascenseur",
    dpe: "C",
    ges: "B",
    description:
      "Au cœur du 6e arrondissement, à deux pas du parc de la Tête d'Or, ce T3 traversant de 68 m² bénéficie d'une belle luminosité tout au long de la journée.",
    mandateType: "exclusif",
    mandateEnd: "2027-02-12",
    views: 412,
    visitsCount: 5,
  },
  {
    ...base,
    id: "demo-maison-ecully",
    reference: "IMM-2026-044",
    title: "Maison des Tilleuls",
    kind: "maison",
    status: "a-publier",
    city: "Écully",
    surface: 140,
    rooms: 6,
    bedrooms: 4,
    floor: null,
    dpe: "B",
    ges: "A",
    description: null,
    mandateType: "exclusif",
    mandateEnd: "2027-03-30",
    views: 0,
    visitsCount: 0,
  },
  {
    ...base,
    id: "demo-studio",
    reference: "IMM-2026-037",
    title: "Studio rénové",
    kind: "appartement",
    status: "offre",
    city: "Villeurbanne",
    surface: 24,
    rooms: 1,
    bedrooms: 0,
    floor: "2e sur 4",
    dpe: "D",
    ges: "C",
    description: "Studio entièrement rénové, idéal premier achat ou investissement locatif.",
    mandateType: "simple",
    mandateEnd: "2027-01-15",
    views: 689,
    visitsCount: 9,
  },
];

export const DEMO_STATS: DashboardStats = {
  activeProperties: 3,
  toPublish: 1,
  visitsNext7Days: 3,
  qualifiedBuyers: 2,
  mandatesThisMonth: 1,
};

export const DEMO_VISITS: Visit[] = [
  {
    id: "demo-v1",
    startsAt: "2026-11-04T10:00:00+01:00",
    status: "prevue",
    propertyId: "demo-t3-lyon6",
    propertyTitle: "T3 lumineux avec balcon",
    buyerName: "M. et Mme Martin",
    voucherSigned: true,
  },
];
