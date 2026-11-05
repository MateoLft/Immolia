import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEMO_ACCOUNT, DEMO_PROPERTIES, DEMO_STATS, DEMO_VISITS } from "./mock-data";
import type { GeneratedContent } from "./studio";
import type { BuyerFull } from "./buyers";
import type { PropertyDocument } from "./documents";
import {
  ACTIVE_STATUSES,
  initialsOf,
  type Account,
  type Seller,
  type Settings,
  type DashboardStats,
  type Property,
  type Buyer,
  type EstimationRequest,
  type Listing,
  type Mandate,
  type PropertyPhoto,
  type Visit,
  type VisitRequest,
} from "./property-types";

/**
 * Accès aux données de l'espace agent.
 * Toutes les requêtes passent par Supabase avec la session de l'utilisateur :
 * les règles RLS limitent automatiquement les résultats à son agence.
 */

const TRIAL_DAYS = 14;

/** Client Supabase + identifiant de l'utilisateur connecté (sinon redirection vers la connexion). */
const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/connexion");
  return { supabase, userId };
});

export const getAccount = cache(async (): Promise<Account> => {
  if (!isSupabaseConfigured) return DEMO_ACCOUNT;
  const { supabase, userId } = await getSession();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, agency_id, agencies(name, subscriptions(plan, status, trial_ends_at))")
    .eq("id", userId)
    .single();

  // Les jointures Supabase renvoient un objet (relation simple) ou un tableau selon le schéma.
  const agency = one(profile?.agencies) as { name: string; subscriptions: unknown } | null;
  const sub = one(agency?.subscriptions) as { plan: Account["plan"]; status: string; trial_ends_at: string } | null;

  // Lu à part : la colonne n'existe qu'après la migration 0006 (une erreur ici ne doit rien casser).
  const { data: fee } = await supabase.from("agencies").select("fee_text").eq("id", profile?.agency_id ?? "").maybeSingle();

  const fullName = profile?.full_name?.trim() || "Mon compte";
  const msLeft = sub ? new Date(sub.trial_ends_at).getTime() - Date.now() : 0;

  return {
    fullName,
    firstName: fullName.split(/\s+/)[0],
    initials: initialsOf(fullName),
    agencyName: agency?.name ?? "Mon agence",
    plan: sub?.plan ?? "essentiel",
    subscriptionStatus: sub?.status ?? "trialing",
    trialDaysLeft: Math.max(0, Math.ceil(msLeft / 86_400_000)),
    trialDays: TRIAL_DAYS,
    demo: false,
    feeText: fee?.fee_text?.trim() || null,
  };
});

export async function getSettings(): Promise<Settings> {
  if (!isSupabaseConfigured) {
    return {
      fullName: DEMO_ACCOUNT.fullName,
      phone: "",
      email: "demo@immolia.fr",
      role: "owner",
      agency: { name: DEMO_ACCOUNT.agencyName, address: "", phone: "", email: "", professionalCard: "", siren: "", feeText: "" },
      canEditAgency: false,
    };
  }
  const { supabase, userId } = await getSession();
  const [{ data: profile }, { data: auth }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, role, agency_id").eq("id", userId).single(),
    supabase.auth.getUser(),
  ]);
  const { data: agency } = await supabase
    .from("agencies")
    .select("name, address, phone, email, professional_card, siren, fee_text")
    .eq("id", profile?.agency_id ?? "")
    .maybeSingle();
  return {
    fullName: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    email: auth.user?.email ?? "",
    role: profile?.role ?? "agent",
    agency: {
      name: agency?.name ?? "",
      address: agency?.address ?? "",
      phone: agency?.phone ?? "",
      email: agency?.email ?? "",
      professionalCard: agency?.professional_card ?? "",
      siren: agency?.siren ?? "",
      feeText: agency?.fee_text ?? "",
    },
    canEditAgency: profile?.role === "owner" || profile?.role === "manager",
  };
}

type PropertyRow = {
  id: string;
  reference: string | null;
  title: string;
  property_type: string;
  status: Property["status"];
  address: string | null;
  city: string;
  postal_code: string | null;
  price_eur: number | null;
  surface_m2: number | string | null;
  rooms: number | null;
  bedrooms: number | null;
  floor: string | null;
  dpe: string | null;
  ges: string | null;
  annual_charges_eur: number | null;
  description: string | null;
  mandate_type: Property["mandateType"];
  mandate_end: string | null;
  views_count: number;
  created_at: string;
  published: boolean;
  public_slug: string | null;
  public_description: string | null;
  seller_id?: string | null;
  visits?: { count: number }[];
  property_photos?: { storage_path: string; position: number }[];
};

const PHOTOS_BUCKET = "property-photos";
const SIGNED_URL_SECONDS = 60 * 60;

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** URLs temporaires (1 h) pour des photos du stockage privé. */
async function signPaths(supabase: Supabase, paths: string[]) {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  const { data } = await supabase.storage.from(PHOTOS_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}

function coverPath(r: PropertyRow) {
  const photos = r.property_photos ?? [];
  if (photos.length === 0) return null;
  return photos.reduce((a, b) => (b.position < a.position ? b : a)).storage_path;
}

async function toPropertiesWithCovers(supabase: Supabase, rows: PropertyRow[]) {
  const paths = rows.map(coverPath).filter((p): p is string => p !== null);
  const urls = await signPaths(supabase, paths);
  return rows.map((r) => {
    const path = coverPath(r);
    return toProperty(r, path ? (urls.get(path) ?? null) : null);
  });
}

function toProperty(r: PropertyRow, coverUrl: string | null = null): Property {
  return {
    id: r.id,
    reference: r.reference,
    title: r.title,
    kind: r.property_type,
    status: r.status,
    address: r.address,
    city: r.city,
    postalCode: r.postal_code,
    price: r.price_eur,
    surface: r.surface_m2 === null ? null : Number(r.surface_m2),
    rooms: r.rooms,
    bedrooms: r.bedrooms,
    floor: r.floor,
    dpe: r.dpe,
    ges: r.ges,
    annualCharges: r.annual_charges_eur,
    description: r.description,
    mandateType: r.mandate_type,
    mandateEnd: r.mandate_end,
    views: r.views_count,
    visitsCount: r.visits?.[0]?.count ?? 0,
    createdAt: r.created_at,
    coverUrl,
    published: r.published ?? false,
    publicSlug: r.public_slug ?? null,
    publicDescription: r.public_description ?? null,
    sellerId: r.seller_id ?? null,
  };
}

export async function listProperties({ limit }: { limit?: number } = {}): Promise<Property[]> {
  if (!isSupabaseConfigured) return limit ? DEMO_PROPERTIES.slice(0, limit) : DEMO_PROPERTIES;
  const { supabase } = await getSession();
  let query = supabase
    .from("properties")
    .select("*, visits(count), property_photos(storage_path, position)")
    .neq("status", "archive")
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw new Error(`Lecture des biens impossible : ${error.message}`);
  return toPropertiesWithCovers(supabase, data as PropertyRow[]);
}

export async function getProperty(id: string): Promise<Property | null> {
  if (!isSupabaseConfigured) return DEMO_PROPERTIES.find((p) => p.id === id) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("properties")
    .select("*, visits(count), property_photos(storage_path, position)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const [property] = await toPropertiesWithCovers(supabase, [data as PropertyRow]);
  return property;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!isSupabaseConfigured) return DEMO_STATS;
  const { supabase } = await getSession();

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 86_400_000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const count = { count: "exact" as const, head: true };
  const [active, toPublish, visits, buyers, mandates] = await Promise.all([
    supabase.from("properties").select("id", count).in("status", ACTIVE_STATUSES),
    supabase.from("properties").select("id", count).eq("status", "a-publier"),
    supabase.from("visits").select("id", count).eq("status", "prevue").gte("starts_at", now.toISOString()).lt("starts_at", in7Days.toISOString()),
    supabase.from("buyers").select("id", count).in("score", ["prioritaire", "qualifie"]),
    supabase.from("properties").select("id", count).not("mandate_type", "is", null).gte("created_at", monthStart.toISOString()),
  ]);

  return {
    activeProperties: active.count ?? 0,
    toPublish: toPublish.count ?? 0,
    visitsNext7Days: visits.count ?? 0,
    qualifiedBuyers: buyers.count ?? 0,
    mandatesThisMonth: mandates.count ?? 0,
  };
}

type BuyerJoin = { full_name: string; phone?: string | null; email?: string | null };
type VisitRow = {
  id: string;
  starts_at: string;
  status: Visit["status"];
  property_id: string;
  voucher_signed_at: string | null;
  feedback?: string | null;
  properties: { title: string } | { title: string }[] | null;
  buyers: BuyerJoin | BuyerJoin[] | null;
};

function toVisit(r: VisitRow): Visit {
  const buyer = one(r.buyers);
  return {
    id: r.id,
    startsAt: r.starts_at,
    status: r.status,
    propertyId: r.property_id,
    propertyTitle: one(r.properties)?.title ?? "Bien",
    buyerName: buyer?.full_name ?? null,
    buyerPhone: buyer?.phone ?? null,
    buyerEmail: buyer?.email ?? null,
    voucherSigned: Boolean(r.voucher_signed_at),
    feedback: r.feedback ?? null,
  };
}

const VISIT_SELECT = "id, starts_at, status, property_id, voucher_signed_at, feedback, properties(title), buyers(full_name, phone, email)";

/** Visites du module Visites : à venir, passées à compléter, réalisées récemment. */
export async function listVisitsOverview(): Promise<{ upcoming: Visit[]; toComplete: Visit[]; done: Visit[] }> {
  if (!isSupabaseConfigured) return { upcoming: DEMO_VISITS, toComplete: [], done: [] };
  const { supabase } = await getSession();
  const now = new Date().toISOString();
  const [upcoming, toComplete, done] = await Promise.all([
    supabase.from("visits").select(VISIT_SELECT).eq("status", "prevue").gte("starts_at", now).order("starts_at").limit(100),
    supabase.from("visits").select(VISIT_SELECT).eq("status", "prevue").lt("starts_at", now).order("starts_at", { ascending: false }).limit(50),
    supabase.from("visits").select(VISIT_SELECT).eq("status", "realisee").order("starts_at", { ascending: false }).limit(15),
  ]);
  const map = (r: { data: unknown }) => ((r.data ?? []) as VisitRow[]).map(toVisit);
  return { upcoming: map(upcoming), toComplete: map(toComplete), done: map(done) };
}

type RequestRow = {
  id: string;
  created_at: string;
  property_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  availability: string | null;
  status: VisitRequest["status"];
  properties: { title: string } | { title: string }[] | null;
};

function toRequest(r: RequestRow): VisitRequest {
  return {
    id: r.id,
    createdAt: r.created_at,
    propertyId: r.property_id,
    propertyTitle: one(r.properties)?.title ?? "Bien",
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    message: r.message,
    availability: r.availability,
    status: r.status,
  };
}

/** Demandes de visite reçues depuis les pages publiques, non encore traitées. */
export async function listNewVisitRequests(): Promise<VisitRequest[]> {
  if (!isSupabaseConfigured) return [];
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("visit_requests")
    .select("id, created_at, property_id, full_name, email, phone, message, availability, status, properties(title)")
    .eq("status", "nouvelle")
    .order("created_at", { ascending: false })
    .limit(100);
  return ((data ?? []) as RequestRow[]).map(toRequest);
}

export async function getVisitRequest(id: string): Promise<VisitRequest | null> {
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("visit_requests")
    .select("id, created_at, property_id, full_name, email, phone, message, availability, status, properties(title)")
    .eq("id", id)
    .maybeSingle();
  return data ? toRequest(data as RequestRow) : null;
}

export async function listBuyers(): Promise<Buyer[]> {
  if (!isSupabaseConfigured) return [];
  const { supabase } = await getSession();
  const { data } = await supabase.from("buyers").select("id, full_name, email, phone, score").order("full_name").limit(500);
  return (data ?? []).map((b) => ({ id: b.id, fullName: b.full_name, email: b.email, phone: b.phone, score: b.score }));
}

/** Prochaines visites prévues (toutes, ou pour un bien donné). */
export async function listUpcomingVisits({ propertyId, limit = 5 }: { propertyId?: string; limit?: number } = {}): Promise<Visit[]> {
  if (!isSupabaseConfigured) return DEMO_VISITS.filter((v) => !propertyId || v.propertyId === propertyId);
  const { supabase } = await getSession();
  let query = supabase
    .from("visits")
    .select("id, starts_at, status, property_id, voucher_signed_at, properties(title), buyers(full_name)")
    .eq("status", "prevue")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(limit);
  if (propertyId) query = query.eq("property_id", propertyId);
  const { data } = await query;
  return ((data ?? []) as VisitRow[]).map(toVisit);
}

/** Photos d'un bien, dans l'ordre (la première est la photo principale). */
export async function listPropertyPhotos(propertyId: string): Promise<PropertyPhoto[]> {
  if (!isSupabaseConfigured) return [];
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("property_photos")
    .select("id, storage_path, position")
    .eq("property_id", propertyId)
    .order("position");
  const rows = data ?? [];
  const urls = await signPaths(supabase, rows.map((r) => r.storage_path));
  return rows
    .map((r) => ({ id: r.id, position: r.position, url: urls.get(r.storage_path) ?? "" }))
    .filter((p) => p.url);
}

/** Diffusions de l'annonce d'un bien sur les portails. */
export async function listListings(propertyId: string): Promise<Listing[]> {
  if (!isSupabaseConfigured) return [];
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("property_listings")
    .select("portal, status, listing_url, published_at, removed_at")
    .eq("property_id", propertyId);
  return (data ?? []).map((l) => ({
    portal: l.portal,
    status: l.status,
    url: l.listing_url,
    publishedAt: l.published_at,
    removedAt: l.removed_at,
  }));
}

/** Contenus générés par le Studio IA pour un bien, du plus récent au plus ancien. */
export async function listGeneratedContents(propertyId: string, limit = 20): Promise<GeneratedContent[]> {
  if (!isSupabaseConfigured) return [];
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("generated_contents")
    .select("id, kind, tone, content, created_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => ({ id: r.id, kind: r.kind, tone: r.tone, content: r.content, createdAt: r.created_at }));
}

type BuyerRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  budget_max_eur: number | null;
  financing: string | null;
  score: BuyerFull["score"];
  notes: string | null;
  cities: string[] | null;
  kinds: string[] | null;
  min_surface_m2: number | string | null;
  min_rooms: number | null;
  status: BuyerFull["status"] | null;
  source: string | null;
  created_at: string;
};

function toBuyer(r: BuyerRow): BuyerFull {
  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone,
    budgetMax: r.budget_max_eur,
    financing: r.financing,
    score: r.score,
    notes: r.notes,
    cities: r.cities ?? [],
    kinds: r.kinds ?? [],
    minSurface: r.min_surface_m2 === null || r.min_surface_m2 === undefined ? null : Number(r.min_surface_m2),
    minRooms: r.min_rooms,
    status: r.status ?? "actif",
    source: r.source,
    createdAt: r.created_at,
  };
}

/** Acquéreurs avec leurs critères (module Acquéreurs et rapprochement). */
export async function listBuyersFull(): Promise<BuyerFull[]> {
  if (!isSupabaseConfigured) return [];
  const { supabase } = await getSession();
  const { data } = await supabase.from("buyers").select("*").order("created_at", { ascending: false }).limit(1000);
  return ((data ?? []) as BuyerRow[]).map(toBuyer);
}

export async function getBuyer(id: string): Promise<BuyerFull | null> {
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { supabase } = await getSession();
  const { data } = await supabase.from("buyers").select("*").eq("id", id).maybeSingle();
  return data ? toBuyer(data as BuyerRow) : null;
}

/** Toutes les visites d'un acquéreur, les plus récentes d'abord. */
export async function listBuyerVisits(buyerId: string): Promise<Visit[]> {
  if (!isSupabaseConfigured) return [];
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("visits")
    .select(VISIT_SELECT)
    .eq("buyer_id", buyerId)
    .order("starts_at", { ascending: false })
    .limit(50);
  return ((data ?? []) as VisitRow[]).map(toVisit);
}

type SellerRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_prospect: boolean;
  next_contact_on: string | null;
  created_at: string;
};

const toSeller = (r: SellerRow): Seller => ({
  id: r.id,
  fullName: r.full_name,
  email: r.email,
  phone: r.phone,
  address: r.address,
  notes: r.notes,
  isProspect: r.is_prospect,
  nextContactOn: r.next_contact_on,
  createdAt: r.created_at,
});

export async function listSellers(): Promise<Seller[]> {
  if (!isSupabaseConfigured) return [];
  const { supabase } = await getSession();
  const { data } = await supabase.from("sellers").select("*").order("full_name").limit(1000);
  return ((data ?? []) as SellerRow[]).map(toSeller);
}

export async function getSeller(id: string): Promise<Seller | null> {
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { supabase } = await getSession();
  const { data } = await supabase.from("sellers").select("*").eq("id", id).maybeSingle();
  return data ? toSeller(data as SellerRow) : null;
}

/** Toutes les visites d'un bien (pour le rapport vendeur). */
export async function listPropertyVisits(propertyId: string): Promise<Visit[]> {
  if (!isSupabaseConfigured) return [];
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("visits")
    .select(VISIT_SELECT)
    .eq("property_id", propertyId)
    .order("starts_at", { ascending: false })
    .limit(200);
  return ((data ?? []) as VisitRow[]).map(toVisit);
}

/** Registre des mandats, du plus récent au plus ancien. */
export async function listMandates(): Promise<Mandate[]> {
  if (!isSupabaseConfigured) return [];
  const { supabase } = await getSession();
  const { data } = await supabase.from("mandates").select("*").order("number", { ascending: false }).limit(5000);
  return (data ?? []).map((m) => ({
    id: m.id,
    number: m.number,
    propertyId: m.property_id,
    sellerId: m.seller_id,
    sellerName: m.seller_name,
    propertyLabel: m.property_label,
    type: m.type,
    signedOn: m.signed_on,
    endsOn: m.ends_on,
    price: m.price_eur,
    feeText: m.fee_text,
    status: m.status,
    notes: m.notes,
    createdAt: m.created_at,
  }));
}

/** Pièces du dossier de vente d'un bien, avec un lien temporaire (1 h) vers chaque fichier. */
export async function listDocuments(propertyId: string): Promise<PropertyDocument[]> {
  if (!isSupabaseConfigured) return [];
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("property_documents")
    .select("id, kind, file_name, storage_path, analysis, created_at")
    .eq("property_id", propertyId)
    .order("created_at");
  const rows = data ?? [];
  const urls = new Map<string, string>();
  if (rows.length > 0) {
    const { data: signed } = await supabase.storage.from("property-documents").createSignedUrls(rows.map((r) => r.storage_path), 3600);
    for (const s of signed ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    fileName: r.file_name,
    url: urls.get(r.storage_path) ?? null,
    analysis: r.analysis,
    createdAt: r.created_at,
  }));
}

/** Nombre de pièces déposées par bien (vue d'ensemble des dossiers). */
export async function countDocumentsByProperty(): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>();
  if (!isSupabaseConfigured) return map;
  const { supabase } = await getSession();
  const { data } = await supabase.from("property_documents").select("property_id, kind").limit(10000);
  for (const r of data ?? []) {
    if (!map.has(r.property_id)) map.set(r.property_id, new Set());
    map.get(r.property_id)!.add(r.kind);
  }
  return map;
}

type EstimationRow = {
  id: string;
  seller_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  property_type: string;
  address: string | null;
  city: string;
  surface_m2: number | string | null;
  rooms: number | null;
  message: string | null;
  status: EstimationRequest["status"];
  price_low: number | null;
  price_high: number | null;
  comment: string | null;
  created_at: string;
};

const toEstimation = (r: EstimationRow): EstimationRequest => ({
  id: r.id,
  sellerId: r.seller_id,
  fullName: r.full_name,
  email: r.email,
  phone: r.phone,
  kind: r.property_type,
  address: r.address,
  city: r.city,
  surface: r.surface_m2 === null ? null : Number(r.surface_m2),
  rooms: r.rooms,
  message: r.message,
  status: r.status,
  priceLow: r.price_low,
  priceHigh: r.price_high,
  comment: r.comment,
  createdAt: r.created_at,
});

export async function listEstimationRequests(): Promise<EstimationRequest[]> {
  if (!isSupabaseConfigured) return [];
  const { supabase } = await getSession();
  const { data } = await supabase.from("estimation_requests").select("*").neq("status", "archivee").order("created_at", { ascending: false }).limit(500);
  return ((data ?? []) as EstimationRow[]).map(toEstimation);
}

export async function getEstimationRequest(id: string): Promise<EstimationRequest | null> {
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { supabase } = await getSession();
  const { data } = await supabase.from("estimation_requests").select("*").eq("id", id).maybeSingle();
  return data ? toEstimation(data as EstimationRow) : null;
}

/** Adresse publique (slug) de l'agence pour la page d'estimation, sans la créer. */
export async function getAgencySlug(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { supabase, userId } = await getSession();
  const { data: profile } = await supabase.from("profiles").select("agency_id").eq("id", userId).single();
  const { data } = await supabase.from("agencies").select("public_slug").eq("id", profile?.agency_id ?? "").maybeSingle();
  return data?.public_slug ?? null;
}

export type VisitDetail = Visit & {
  propertyAddress: string | null;
  propertyCity: string;
  propertyKind: string;
  signerName: string | null;
  signaturePath: string | null;
};

export async function getVisit(id: string): Promise<VisitDetail | null> {
  if (!isSupabaseConfigured || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("visits")
    .select("id, starts_at, status, property_id, voucher_signed_at, voucher_signer_name, voucher_signature_path, feedback, properties(title, address, city, property_type), buyers(full_name, phone, email)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const prop = one(data.properties as unknown as { title: string; address: string | null; city: string; property_type: string } | null);
  return {
    ...toVisit(data as unknown as VisitRow),
    propertyAddress: prop?.address ?? null,
    propertyCity: prop?.city ?? "",
    propertyKind: prop?.property_type ?? "",
    signerName: (data as { voucher_signer_name?: string | null }).voucher_signer_name ?? null,
    signaturePath: (data as { voucher_signature_path?: string | null }).voucher_signature_path ?? null,
  };
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
