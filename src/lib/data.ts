import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEMO_ACCOUNT, DEMO_PROPERTIES, DEMO_STATS, DEMO_VISITS } from "./mock-data";
import type { GeneratedContent } from "./studio";
import {
  ACTIVE_STATUSES,
  initialsOf,
  type Account,
  type DashboardStats,
  type Property,
  type Buyer,
  type Listing,
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
  };
});

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

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
