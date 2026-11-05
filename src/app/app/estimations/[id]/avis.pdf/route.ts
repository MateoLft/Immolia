import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getEstimationRequest, getSettings } from "@/lib/data";
import { A4, COLORS, MARGIN, width as textWidth, newDocument, paragraph, pdfResponse, text } from "@/lib/pdf";
import { formatEuros, formatNumber, kindLabel } from "@/lib/property-types";

/** Avis de valeur au format PDF, aux couleurs de l'agence. */
export async function GET(_req: Request, ctx: RouteContext<"/app/estimations/[id]/avis.pdf">) {
  const { id } = await ctx.params;
  if (!isSupabaseConfigured) return new Response("Indisponible en mode démo", { status: 404 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return new Response("Non connecté", { status: 401 });
  const r = await getEstimationRequest(id);
  if (!r) return new Response("Introuvable", { status: 404 });
  const settings = await getSettings();
  const a = settings.agency;

  const { doc, regular, bold } = await newDocument(`Avis de valeur - ${r.fullName}`);
  const page = doc.addPage([A4.w, A4.h]);
  const width = A4.w - MARGIN * 2;
  let y = A4.h - MARGIN;

  text(page, a.name || "Agence", MARGIN, y - 14, bold, 16, COLORS.brand);
  const contact = [a.address, a.phone, a.email].filter(Boolean).join("  ·  ");
  if (contact) paragraph(page, contact, MARGIN, y - 32, width, regular, 9, COLORS.muted);
  y -= 80;

  text(page, "Avis de valeur", MARGIN, y, bold, 24);
  y -= 22;
  text(page, `Établi le ${new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris" }).format(new Date())} pour ${r.fullName}`, MARGIN, y, regular, 11, COLORS.muted);
  y -= 40;

  text(page, "Le bien", MARGIN, y, bold, 13);
  y -= 20;
  const facts = [
    ["Type", kindLabel(r.kind)],
    ["Localisation", [r.address, r.city].filter(Boolean).join(", ")],
    ["Surface habitable", r.surface ? `${formatNumber(r.surface)} m²` : "Non communiquée"],
    ["Nombre de pièces", r.rooms ? String(r.rooms) : "Non communiqué"],
  ];
  for (const [k, v] of facts) {
    text(page, k, MARGIN, y, regular, 10.5, COLORS.muted);
    y = paragraph(page, v, MARGIN + 140, y, width - 140, bold, 10.5) - 4;
  }
  y -= 20;

  page.drawRectangle({ x: MARGIN, y: y - 70, width, height: 80, color: COLORS.canvas, borderColor: COLORS.line, borderWidth: 1 });
  text(page, "Valeur estimée", MARGIN + 18, y - 18, regular, 11, COLORS.muted);
  const range = r.priceLow && r.priceHigh ? `${formatEuros(r.priceLow)}  à  ${formatEuros(r.priceHigh)}` : "À définir";
  text(page, range, MARGIN + 18, y - 48, bold, 22, COLORS.brand);
  if (r.priceLow && r.priceHigh && r.surface) {
    const m2 = `soit ${formatEuros(Math.round(r.priceLow / r.surface))} à ${formatEuros(Math.round(r.priceHigh / r.surface))} / m²`;
    text(page, m2, A4.w - MARGIN - 18 - textWidth(regular, m2, 10), y - 46, regular, 10, COLORS.muted);
  }
  y -= 110;

  if (r.comment) {
    text(page, "Notre analyse", MARGIN, y, bold, 13);
    y = paragraph(page, r.comment, MARGIN, y - 22, width, regular, 10.5, COLORS.ink) - 10;
  }

  const signature = [settings.fullName, a.name].filter(Boolean).join(" - ");
  text(page, signature, MARGIN, Math.max(y - 20, MARGIN + 80), bold, 11);
  const legal = [
    "Le présent avis de valeur est établi à partir des informations communiquées et de la connaissance du marché local par l'agence. Il ne constitue pas une expertise immobilière.",
    a.professionalCard && `Carte professionnelle n° ${a.professionalCard}`,
    a.siren && `SIREN ${a.siren}`,
  ].filter(Boolean).join("  ");
  paragraph(page, legal, MARGIN, MARGIN + 30, width, regular, 8, COLORS.muted, 1.35);

  return pdfResponse(await doc.save(), "avis-de-valeur.pdf");
}
