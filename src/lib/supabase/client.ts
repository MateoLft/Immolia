import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

/** Client Supabase dans le navigateur (utilisé pour l'envoi direct des photos). */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const PHOTOS_BUCKET = "property-photos";
