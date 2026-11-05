import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Pages internes vers lesquelles un lien reçu par email peut renvoyer. */
function safeNext(value: string | null) {
  if (value === "/nouveau-mot-de-passe") return value;
  if (value && value.startsWith("/app") && !value.startsWith("//")) return value;
  return "/app";
}

/** Liens reçus par email (confirmation d'inscription, mot de passe oublié) : ouvre la session puis redirige. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("suite"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/connexion?erreur=lien`);
}
