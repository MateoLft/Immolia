"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAccount, getProperty } from "@/lib/data";
import { generatePropertyContent } from "@/lib/ai";
import { isContentKind, isTone, type GeneratedContent } from "@/lib/studio";

export type GenerateResult = { ok: true; content: GeneratedContent; saved: boolean } | { ok: false; error: string };

export async function generateContent(propertyId: string, kind: string, tone: string): Promise<GenerateResult> {
  if (!isContentKind(kind) || !isTone(tone)) return { ok: false, error: "Demande invalide." };

  const property = await getProperty(propertyId);
  if (!property) return { ok: false, error: "Bien introuvable." };
  const account = await getAccount();

  const result = await generatePropertyContent(property, account.agencyName, kind, tone);
  if (!result.ok) return result;

  const draft: GeneratedContent = {
    id: crypto.randomUUID(),
    kind,
    tone,
    content: result.text,
    createdAt: new Date().toISOString(),
  };

  // En mode démo, le contenu est affiché mais pas enregistré.
  if (!isSupabaseConfigured) return { ok: true, content: draft, saved: false };

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
    return { ok: true, content: draft, saved: false };
  }
  return { ok: true, content: { ...draft, id: data.id, createdAt: data.created_at }, saved: true };
}
