"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { siteUrl } from "@/lib/site-url";

type Result = { ok: true } | { ok: false; error: string };

async function session() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: me } = await supabase.from("profiles").select("role, agency_id").eq("id", userId).single();
  return me ? { supabase, userId, role: me.role as string, agencyId: me.agency_id as string } : null;
}

export async function inviteMember(email: string, role: string): Promise<{ ok: true; link: string } | { ok: false; error: string }> {
  const s = await session();
  if (!s) return { ok: false, error: "Indisponible en mode démo ou session expirée." };
  if (!["owner", "manager"].includes(s.role)) return { ok: false, error: "Seuls le responsable et les managers peuvent inviter." };
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { ok: false, error: "Adresse email invalide." };
  const wanted = role === "manager" ? "manager" : "agent";
  if (wanted === "manager" && s.role !== "owner") return { ok: false, error: "Seul le responsable peut inviter un manager." };

  const { data: existing } = await s.supabase.from("profiles").select("id").ilike("email", clean).maybeSingle();
  if (existing) return { ok: false, error: "Cette personne fait déjà partie de votre agence." };

  const token = randomBytes(24).toString("hex");
  const { error } = await s.supabase.from("agency_invitations").insert({ email: clean, role: wanted, token, invited_by: s.userId });
  if (error) return { ok: false, error: "L'invitation a échoué. Le script 0009 a-t-il été exécuté dans Supabase ?" };
  revalidatePath("/app/equipe");
  return { ok: true, link: `${await siteUrl()}/invitation/${token}` };
}

export async function revokeInvitation(id: string): Promise<Result> {
  const s = await session();
  if (!s || !["owner", "manager"].includes(s.role)) return { ok: false, error: "Action non autorisée." };
  const { error } = await s.supabase.from("agency_invitations").update({ revoked_at: new Date().toISOString() }).eq("id", id);
  if (error) return { ok: false, error: "L'annulation a échoué." };
  revalidatePath("/app/equipe");
  return { ok: true };
}

export async function updateMember(id: string, change: { role?: string; active?: boolean }): Promise<Result> {
  const s = await session();
  if (!s || s.role !== "owner") return { ok: false, error: "Seul le responsable de l'agence peut modifier les rôles et les accès." };
  if (id === s.userId) return { ok: false, error: "Vous ne pouvez pas modifier votre propre rôle ou accès." };
  const update: Record<string, unknown> = {};
  if (change.role !== undefined) {
    if (!["manager", "agent"].includes(change.role)) return { ok: false, error: "Rôle invalide." };
    update.role = change.role;
  }
  if (change.active !== undefined) update.active = change.active;
  const { data, error } = await s.supabase.from("profiles").update(update).eq("id", id).eq("agency_id", s.agencyId).select("id").maybeSingle();
  if (error || !data) return { ok: false, error: "La modification a échoué. Le script 0009 a-t-il été exécuté dans Supabase ?" };
  revalidatePath("/app/equipe");
  return { ok: true };
}
