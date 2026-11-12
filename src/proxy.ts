import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Rafraîchit la session Supabase et protège l'espace agent (/app).
 * Sans clés Supabase (mode démo local), laisse tout passer ; en production, refuse l'accès à /app.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured) {
    // En production, ne jamais basculer silencieusement sur les données d'exemple :
    // une variable d'environnement perdue doit se voir, pas ressembler à une perte de données.
    if (process.env.VERCEL_ENV === "production" && request.nextUrl.pathname.startsWith("/app")) {
      return new NextResponse("Service momentanément indisponible : configuration manquante.", { status: 503, headers: { "Retry-After": "300" } });
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (!isLoggedIn && pathname === "/nouveau-mot-de-passe") {
    const url = request.nextUrl.clone();
    url.pathname = "/mot-de-passe-oublie";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!isLoggedIn && pathname.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("suite", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && (pathname === "/connexion" || pathname === "/inscription")) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/connexion", "/inscription", "/nouveau-mot-de-passe"],
};
