"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { parisToIso } from "@/lib/paris-time";
import { FINANCING_OPTIONS } from "@/lib/property-types";

export type VisitFormState = { error?: string; values?: Record<string, string> };
type Result = { ok: true } | { ok: false; error: string };

const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

async function session() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return userId ? { supabase, userId } : null;
}

export async function createVisit(_prev: VisitFormState, form: FormData): Promise<VisitFormState> {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const values = Object.fromEntries(
    [...form.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$")).map(([k, v]) => [k, String(v)]),
  );

  const propertyId = get("property_id");
  const buyerMode = get("buyer_mode");
  const startsAt = parisToIso(get("date"), get("time"));
  if (!isUuid(propertyId)) return { error: "Choisissez le bien à visiter.", values };
  if (!startsAt) return { error: "Indiquez la date et l'heure de la visite.", values };
  if (buyerMode === "existing" && !isUuid(get("buyer_id"))) return { error: "Choisissez l'acquéreur.", values };
  if (buyerMode !== "existing" && !get("buyer_name")) return { error: "Indiquez le nom de l'acquéreur.", values };

  const s = await session();
  if (!s) return { error: "Indisponible en mode démo ou session expirée.", values };
  const { supabase, userId } = s;

  let buyerId = buyerMode === "existing" ? get("buyer_id") : null;
  if (!buyerId) {
    const financing = FINANCING_OPTIONS.find((f) => f.value === get("financing")) ?? FINANCING_OPTIONS[2];
    const { data: buyer, error } = await supabase
      .from("buyers")
      .insert({
        full_name: get("buyer_name"),
        email: get("buyer_email") || null,
        phone: get("buyer_phone") || null,
        financing: financing.label,
        score: financing.score,
        source: get("request_id") ? "page publique" : "saisie agent",
      })
      .select("id")
      .single();
    if (error || !buyer) return { error: "La création de l'acquéreur a échoué.", values };
    buyerId = buyer.id;
  }

  const { error } = await supabase.from("visits").insert({
    property_id: propertyId,
    buyer_id: buyerId,
    agent_id: userId,
    starts_at: startsAt,
    feedback: get("notes") || null,
  });
  if (error) return { error: "L'enregistrement de la visite a échoué.", values };

  const requestId = get("request_id");
  if (isUuid(requestId)) {
    await supabase.from("visit_requests").update({ status: "planifiee", buyer_id: buyerId }).eq("id", requestId);
  }
  redirect("/app/visites");
}

export async function setVisitStatus(id: string, status: "realisee" | "annulee", feedback?: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "Indisponible en mode démo ou session expirée." };
  const update: Record<string, unknown> = { status };
  if (feedback !== undefined) update.feedback = feedback.trim().slice(0, 4000) || null;
  const { error } = await s.supabase.from("visits").update(update).eq("id", id);
  if (error) return { ok: false, error: "La mise à jour a échoué." };
  revalidatePath("/app/visites");
  return { ok: true };
}

export async function setVoucherSigned(id: string, signed: boolean): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "Indisponible en mode démo ou session expirée." };
  const { error } = await s.supabase
    .from("visits")
    .update({ voucher_signed_at: signed ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { ok: false, error: "La mise à jour a échoué." };
  revalidatePath("/app/visites");
  return { ok: true };
}

export async function archiveVisitRequest(id: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "Indisponible en mode démo ou session expirée." };
  const { error } = await s.supabase.from("visit_requests").update({ status: "archivee" }).eq("id", id);
  if (error) return { ok: false, error: "La mise à jour a échoué." };
  revalidatePath("/app/visites");
  return { ok: true };
}
