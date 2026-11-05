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
  published: boolean;
  publicSlug: string | null;
  /** Texte affiché sur la page publique (distinct des notes internes). */
  publicDescription: string | null;
  sellerId: string | null;
};

export type Seller = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isProspect: boolean;
  nextContactOn: string | null;
  createdAt: string;
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
  buyerPhone?: string | null;
  buyerEmail?: string | null;
  voucherSigned: boolean;
  feedback?: string | null;
};

export type VisitRequest = {
  id: string;
  createdAt: string;
  propertyId: string;
  propertyTitle: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  availability: string | null;
  status: "nouvelle" | "planifiee" | "archivee";
};

export type Buyer = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  score: "prioritaire" | "qualifie" | "a-qualifier";
};

export const FINANCING_OPTIONS = [
  { value: "pret-accorde", label: "Prêt accordé / achat comptant", score: "prioritaire" },
  { value: "accord-principe", label: "Accord de principe de la banque", score: "qualifie" },
  { value: "non-etudie", label: "Financement non étudié", score: "a-qualifier" },
] as const;

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
  /** Mention honoraires par défaut (Paramètres), sinon null. */
  feeText: string | null;
};

export type Settings = {
  fullName: string;
  phone: string;
  email: string;
  role: string;
  agency: {
    name: string;
    address: string;
    phone: string;
    email: string;
    professionalCard: string;
    siren: string;
    feeText: string;
  };
  canEditAgency: boolean;
};

export const DEFAULT_FEE_TEXT = "Honoraires : [À COMPLÉTER]";

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

export type Listing = {
  portal: string;
  status: "publie" | "retire";
  url: string | null;
  publishedAt: string;
  removedAt: string | null;
};

/** Statuts pour lesquels les annonces doivent être retirées des portails. */
export const OFF_MARKET_STATUSES: PropertyStatus[] = ["compromis", "vendu", "archive"];

export type MandateStatus = "en-cours" | "vendu" | "expire" | "resilie";

export const MANDATE_STATUS_LABEL: Record<MandateStatus, { label: string; tone: BadgeTone }> = {
  "en-cours": { label: "En cours", tone: "brand" },
  vendu: { label: "Vendu", tone: "success" },
  expire: { label: "Expiré", tone: "neutral" },
  resilie: { label: "Résilié", tone: "neutral" },
};

export type Mandate = {
  id: string;
  number: number;
  propertyId: string | null;
  sellerId: string | null;
  sellerName: string;
  propertyLabel: string;
  type: MandateType;
  signedOn: string;
  endsOn: string | null;
  price: number | null;
  feeText: string | null;
  status: MandateStatus;
  notes: string | null;
  createdAt: string;
};

export type EstimationRequest = {
  id: string;
  sellerId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  kind: string;
  address: string | null;
  city: string;
  surface: number | null;
  rooms: number | null;
  message: string | null;
  status: "nouvelle" | "en-cours" | "envoyee" | "archivee";
  priceLow: number | null;
  priceHigh: number | null;
  comment: string | null;
  createdAt: string;
};

export const ESTIMATION_STATUS_LABEL: Record<EstimationRequest["status"], { label: string; tone: BadgeTone }> = {
  nouvelle: { label: "Nouvelle", tone: "warning" },
  "en-cours": { label: "En cours", tone: "brand" },
  envoyee: { label: "Avis envoyé", tone: "success" },
  archivee: { label: "Archivée", tone: "neutral" },
};
