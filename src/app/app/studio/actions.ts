"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAccount, getProperty, listPropertyPhotos } from "@/lib/data";
import { MAX_AI_PHOTOS, generatePropertyContent } from "@/lib/ai";
import { isContentKind, isTone, type GeneratedContent } from "@/lib/studio";

export type GenerateResult =
  | { ok: true; content: GeneratedContent; saved: boolean; usedPhotos: number; photosRequested: number }
  | { ok: false; error: string };

export async function generateContent(propertyId: string, kind: string, tone: string, usePhotos = true): Promise<GenerateResult> {
  if (!isContentKind(kind) || !isTone(tone)) return { ok: false, error: "Demande invalide." };

  const property = await getProperty(propertyId);
  if (!property) return { ok: false, error: "Bien introuvable." };
  const account = await getAccount();

  const photoUrls = usePhotos ? (await listPropertyPhotos(property.id)).slice(0, MAX_AI_PHOTOS).map((p) => p.url) : [];

  const result = await generatePropertyContent(property, account.agencyName, kind, tone, photoUrls, account.feeText);
  if (!result.ok) return result;
  const photoInfo = { usedPhotos: result.usedPhotos, photosRequested: photoUrls.length };

  const draft: GeneratedContent = {
    id: crypto.randomUUID(),
    kind,
    tone,
    content: result.text,
    createdAt: new Date().toISOString(),
  };

  // En mode démo, le contenu est affiché mais pas enregistré.
  if (!isSupabaseConfigured) return { ok: true, content: draft, saved: false, ...photoInfo };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/connexion");

  const { data, error } = await supabase
    .from("generated_contents")
    .insert({
      property_id: property.id,
      created_by: userId,
      kind,
      tone,
      content: result.text,
      model: result.model,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
    })
    .select("id, created_at")
    .single();

  if (error || !data) {
    console.error("Studio IA : enregistrement impossible", error?.message);
    return { ok: true, content: draft, saved: false, ...photoInfo };
  }
  return { ok: true, content: { ...draft, id: data.id, createdAt: data.created_at }, saved: true, ...photoInfo };
}
