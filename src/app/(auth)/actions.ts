"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthState = { error?: string; message?: string };

const NOT_CONFIGURED: AuthState = {
  error: "Les comptes ne sont pas encore activés. Utilisez « Accéder à la démo » en attendant.",
};

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

/** N'accepte qu'une redirection interne vers l'espace agent. */
function safeNext(value: string) {
  return value.startsWith("/app") && !value.startsWith("//") ? value : "/app";
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;

  const fullName = text(form, "name");
  const agencyName = text(form, "agency");
  const email = text(form, "email");
  const password = String(form.get("password") ?? "");

  if (!fullName || !agencyName || !email) return { error: "Merci de remplir tous les champs." };
  if (password.length < 8) return { error: "Le mot de passe doit contenir au moins 8 caractères." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, agency_name: agencyName } },
  });

  if (error) {
    return { error: error.code === "user_already_exists" ? "Un compte existe déjà avec cet email." : "L'inscription a échoué, merci de réessayer." };
  }
  if (!data.session) {
    return { message: "Compte créé ! Confirmez votre adresse en cliquant sur le lien reçu par email." };
  }
  redirect("/app");
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: text(form, "email"),
    password: String(form.get("password") ?? ""),
  });

  if (error) {
    return {
      error: error.code === "email_not_confirmed" ? "Confirmez d'abord votre adresse email." : "Email ou mot de passe incorrect.",
    };
  }
  redirect(safeNext(text(form, "suite")));
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/connexion");
}
