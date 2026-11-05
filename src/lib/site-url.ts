import "server-only";
import { headers } from "next/headers";

/** Adresse du site (ex. https://immolia.vercel.app), pour les liens partagés et les QR codes. */
export async function siteUrl() {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL;
  if (fixed) return fixed.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function publicPropertyPath(slug: string) {
  return `/b/${slug}`;
}
