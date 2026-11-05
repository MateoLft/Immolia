"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { draftEstimationComment } from "@/lib/ai";
import { getEstimationRequest, listProperties } from "@/lib/data";
import { comparables } from "@/lib/estimation";

type Result = { ok: true } | { ok: false; error: string };

async function session() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return userId ? { supabase, userId } : null;
}

const slugify = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

/** Crée l'adresse publique de la page d'estimation de l'agence (une seule fois). */
export async function enableEstimationPage(): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "Indisponible en mode démo ou session expirée." };
  const { data: profile } = await s.supabase.from("profiles").select("agency_id, role").eq("id", s.userId).single();
  if (!profile || !["owner", "manager"].includes(profile.role)) return { ok: false, error: "Seul le responsable de l'agence peut activer la page." };
  const { data: agency } = await s.supabase.from("agencies").select("name, public_slug").eq("id", profile.agency_id).single();
  if (agency?.public_slug) return { ok: true };
  const slug = `${slugify(agency?.name ?? "agence") || "agence"}-${crypto.randomUUID().slice(0, 4)}`;
  const { error } = await s.supabase.from("agencies").update({ public_slug: slug }).eq("id", profile.agency_id);
  if (error) return { ok: false, error: "L'activation a échoué. Le script 0007 a-t-il été exécuté dans Supabase ?" };
  revalidatePath("/app/estimations");
  return { ok: true };
}

export async function saveEstimation(id: string, values: { priceLow: string; priceHigh: string; comment: string; status: string }): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "Indisponible en mode démo ou session expirée." };
  const num = (v: string) => (v.trim() ? Number(v.replace(/\s/g, "")) : null);
  const low = num(values.priceLow);
  const high = num(values.priceHigh);
  if ([low, high].some((n) => n !== null && (!Number.isFinite(n) || n < 0))) return { ok: false, error: "Prix invalide." };
  if (low !== null && high !== null && low > high) return { ok: false, error: "Le prix bas doit être inférieur au prix haut." };
  const status = ["nouvelle", "en-cours", "envoyee", "archivee"].includes(values.status) ? values.status : "en-cours";
  const { error } = await s.supabase
    .from("estimation_requests")
    .update({ price_low: low === null ? null : Math.round(low), price_high: high === null ? null : Math.round(high), comment: values.comment.trim().slice(0, 6000) || null, status })
    .eq("id", id);
  if (error) return { ok: false, error: "L'enregistrement a échoué." };
  revalidatePath(`/app/estimations/${id}`);
  revalidatePath("/app/estimations");
  return { ok: true };
}

export async function draftComment(id: string, priceLow: string, priceHigh: string, notes: string): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const s = await session();
  if (!s) return { ok: false, error: "Indisponible en mode démo ou session expirée." };
  const req = await getEstimationRequest(id);
  if (!req) return { ok: false, error: "Demande introuvable." };
  const { median, list } = comparables(await listProperties(), req.city, req.kind);
  const n = (v: string) => (v.trim() ? Number(v.replace(/\s/g, "")) || null : null);
  return draftEstimationComment({
    kind: req.kind,
    city: req.city,
    surface: req.surface,
    rooms: req.rooms,
    ownerMessage: req.message,
    priceLow: n(priceLow),
    priceHigh: n(priceHigh),
    medianPerM2: median,
    comparablesCount: list.length,
    agentNotes: notes.trim() || null,
  });
}
