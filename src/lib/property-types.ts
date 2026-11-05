import type { BadgeTone } from "@/components/ui/badge";

/** Types et libellés partagés entre le serveur et le navigateur. */

export const PROPERTY_STATUSES = ["brouillon", "a-publier", "en-ligne", "offre", "compromis", "vendu", "archive"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const STATUS_LABEL: Record<PropertyStatus, { label: string; tone: BadgeTone }> = {
  brouillon: { label: "Brouillon", tone: "neutral" },
  "a-publier": { label: "À publier", tone: "warning" },
  "en-ligne": { label: "En ligne", tone: "success" },
  offre: { label: "Offre reçue", tone: "brand" },
  compromis: { label: "Compromis", tone: "neutral" },
  vendu: { label: "Vendu", tone: "success" },
  archive: { label: "Archivé", tone: "neutral" },
};

/** Statuts comptés comme « biens actifs » (en portefeuille). */
export const ACTIVE_STATUSES: PropertyStatus[] = ["brouillon", "a-publier", "en-ligne", "offre", "compromis"];

export const PROPERTY_KINDS = [
  { value: "appartement", label: "Appartement" },
  { value: "maison", label: "Maison" },
  { value: "terrain", label: "Terrain" },
  { value: "local", label: "Local commercial" },
  { value: "immeuble", label: "Immeuble" },
  { value: "parking", label: "Parking / box" },
] as const;

export const MANDATE_TYPES = [
  { value: "simple", label: "Simple" },
  { value: "exclusif", label: "Exclusif" },
  { value: "semi-exclusif", label: "Semi-exclusif" },
] as const;
export type MandateType = (typeof MANDATE_TYPES)[number]["value"];

export const ENERGY_CLASSES = ["A", "B", "C", "D", "E", "F", "G"] as const;

export type Property = {
  id: string;
  reference: string | null;
  title: string;
  kind: string;
  status: PropertyStatus;
  address: string | null;
  city: string;
  postalCode: string | null;
  price: number | null;
  surface: number | null;
  rooms: number | null;
  bedrooms: number | null;
  floor: string | null;
  dpe: string | null;
  ges: string | null;
  annualCharges: number | null;
  description: string | null;
  mandateType: MandateType | null;
  mandateEnd: string | null;
  views: number;
  visitsCount: number;
  createdAt: string;
  /** URL temporaire de la photo principale, si le bien en a une. */
  coverUrl: string | null;
};

export type PropertyPhoto = {
  id: string;
  url: string;
  position: number;
};

export type Visit = {
  id: string;
  startsAt: string;
  status: "prevue" | "realisee" | "annulee";
  propertyId: string;
  propertyTitle: string;
  buyerName: string | null;
  voucherSigned: boolean;
};

export type Account = {
  fullName: string;
  firstName: string;
  initials: string;
  agencyName: string;
  plan: "essentiel" | "pro" | "agence";
  subscriptionStatus: string;
  trialDaysLeft: number;
  trialDays: number;
  demo: boolean;
};

export type DashboardStats = {
  activeProperties: number;
  toPublish: number;
  visitsNext7Days: number;
  qualifiedBuyers: number;
  mandatesThisMonth: number;
};

const nf = new Intl.NumberFormat("fr-FR");
export const formatNumber = (n: number | null | undefined) => (n === null || n === undefined ? "—" : nf.format(n));
export const formatEuros = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${nf.format(n)} €`);

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function mandateLabel(type: MandateType | null) {
  return MANDATE_TYPES.find((m) => m.value === type)?.label ?? "—";
}

export function kindLabel(kind: string) {
  return PROPERTY_KINDS.find((k) => k.value === kind)?.label ?? kind;
}

/** Couleur de vignette stable par bien, en attendant les photos. */
const TINTS = ["#DCE6FF", "#FDE7C8", "#D3F0E2", "#FBDCD2", "#E4E7EC", "#E9DDFB"];
export function tintFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}
