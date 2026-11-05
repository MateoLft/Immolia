"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { analyzeDocument } from "@/lib/ai";
import { kindOf } from "@/lib/documents";

type Result = { ok: true } | { ok: false; error: string };
const BUCKET = "property-documents";

async function session() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return userId ? { supabase, userId } : null;
}

export async function prepareDocumentUpload(propertyId: string): Promise<{ ok: true; folder: string } | { ok: false; error: string }> {
  const s = await session();
  if (!s) return { ok: false, error: "Indisponible en mode démo ou session expirée." };
  const { data } = await s.supabase.from("properties").select("id, agency_id").eq("id", propertyId).maybeSingle();
  if (!data) return { ok: false, error: "Bien introuvable." };
  return { ok: true, folder: `${data.agency_id}/${data.id}` };
}

export async function registerDocument(propertyId: string, kind: string, path: string, fileName: string): Promise<Result> {
  if (!kindOf(kind)) return { ok: false, error: "Type de document inconnu." };
  const s = await session();
  if (!s) return { ok: false, error: "Session expirée, reconnectez-vous." };
  const { data: p } = await s.supabase.from("properties").select("id, agency_id").eq("id", propertyId).maybeSingle();
  if (!p || !path.startsWith(`${p.agency_id}/${p.id}/`) || path.includes("..")) return { ok: false, error: "Document invalide." };
  const { error } = await s.supabase.from("property_documents").insert({
    property_id: propertyId,
    kind,
    file_name: fileName.slice(0, 200),
    storage_path: path,
    uploaded_by: s.userId,
  });
  if (error) return { ok: false, error: "L'enregistrement a échoué. Le script 0007 a-t-il été exécuté dans Supabase ?" };
  revalidatePath(`/app/biens/${propertyId}/dossier`);
  return { ok: true };
}

export async function deleteDocument(id: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "Session expirée, reconnectez-vous." };
  const { data: doc } = await s.supabase.from("property_documents").select("id, property_id, storage_path").eq("id", id).maybeSingle();
  if (!doc) return { ok: false, error: "Document introuvable." };
  await s.supabase.storage.from(BUCKET).remove([doc.storage_path]);
  const { error } = await s.supabase.from("property_documents").delete().eq("id", id);
  if (error) return { ok: false, error: "La suppression a échoué." };
  revalidatePath(`/app/biens/${doc.property_id}/dossier`);
  return { ok: true };
}

/** Synthèse du document par l'IA (PV d'AG, règlement, diagnostics…), enregistrée avec le document. */
export async function runDocumentAnalysis(id: string): Promise<Result> {
  const s = await session();
  if (!s) return { ok: false, error: "Session expirée, reconnectez-vous." };
  const { data: doc } = await s.supabase.from("property_documents").select("id, property_id, kind, storage_path, file_name").eq("id", id).maybeSingle();
  if (!doc) return { ok: false, error: "Document introuvable." };

  const { data: file } = await s.supabase.storage.from(BUCKET).download(doc.storage_path);
  if (!file) return { ok: false, error: "Fichier introuvable dans le stockage." };
  const bytes = Buffer.from(await file.arrayBuffer());
  const head = bytes.subarray(0, 4);
  const mediaType = head[0] === 0x25 && head[1] === 0x50 ? "application/pdf" : head[0] === 0x89 ? "image/png" : head[0] === 0xff ? "image/jpeg" : null;
  if (!mediaType) return { ok: false, error: "Format non pris en charge (PDF, JPEG ou PNG)." };

  const result = await analyzeDocument(bytes.toString("base64"), doc.kind, mediaType);
  if (!result.ok) return result;
  const { error } = await s.supabase.from("property_documents").update({ analysis: result.text }).eq("id", id);
  if (error) return { ok: false, error: "L'analyse n'a pas pu être enregistrée." };
  revalidatePath(`/app/biens/${doc.property_id}/dossier`);
  return { ok: true };
}
