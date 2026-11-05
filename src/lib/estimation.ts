import type { Property } from "./property-types";

/** Prix au m² des biens comparables du portefeuille de l'agence (même ville, même type). */
export function comparables(properties: Property[], city: string, kind: string) {
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const target = norm(city);
  const list = properties
    .filter((p) => p.price && p.surface && p.surface > 0 && (norm(p.city).includes(target) || target.includes(norm(p.city))))
    .filter((p) => p.kind === kind)
    .map((p) => ({ id: p.id, title: p.title, city: p.city, price: p.price!, surface: p.surface!, perM2: Math.round(p.price! / p.surface!), status: p.status }));
  const sorted = list.map((c) => c.perM2).sort((a, b) => a - b);
  const median = sorted.length === 0 ? null : sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2);
  return { list, median };
}
