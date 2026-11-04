export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Clé publique du projet : la nouvelle « Publishable key » (sb_publishable_…)
 * ou l'ancienne clé « anon ». Les deux noms de variable sont acceptés.
 */
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Tant que les clés Supabase ne sont pas renseignées, l'application tourne
 * en « mode démo » : l'espace agent est accessible avec des données d'exemple.
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
