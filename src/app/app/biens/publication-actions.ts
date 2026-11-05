"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Result = { ok: true } | { ok: false; error: string };

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function session() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ? supabase : null;
}

export async function setPublished(propertyId: string, published: boolean): Promise<Result> {
  const supabase = await session();
  if (!supabase) return { ok: false, error: "Indisponible en mode démo ou session expirée." };

  const { data: p } = await supabase
    .from("properties")
    .select("id, title, city, status, public_slug, public_description, description")
    .eq("id", propertyId)
    .maybeSingle();
  if (!p) return { ok: false, error: "Bien introuvable." };
  if (published && (p.status === "brouillon" || p.status === "archive")) {
    return { ok: false, error: "Changez d'abord le statut du bien (par exemple « En ligne ») : un brouillon ou un bien archivé ne peut pas être publié." };
  }

  const update: Record<string, unknown> = { published };
  if (published) {
    update.published_at = new Date().toISOString();
    if (!p.public_slug) {
      const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
      update.public_slug = `${slugify(`${p.title} ${p.city}`) || "bien"}-${suffix}`;
    }
  }

  const { error } = await supabase.from("properties").update(update).eq("id", propertyId);
  if (error) return { ok: false, error: "La publication a échoué. Le script 0004 a-t-il bien été exécuté dans Supabase ?" };
  revalidatePath(`/app/biens/${propertyId}`);
  return { ok: true };
}

export async function savePublicDescription(propertyId: string, text: string): Promise<Result> {
  const supabase = await session();
  if (!supabase) return { ok: false, error: "Indisponible en mode démo ou session expirée." };
  if (text.length > 10_000) return { ok: false, error: "Texte trop long (10 000 caractères maximum)." };

  const { error } = await supabase
    .from("properties")
    .update({ public_description: text.trim() || null })
    .eq("id", propertyId);
  if (error) return { ok: false, error: "L'enregistrement a échoué." };
  revalidatePath(`/app/biens/${propertyId}`);
  return { ok: true };
}
