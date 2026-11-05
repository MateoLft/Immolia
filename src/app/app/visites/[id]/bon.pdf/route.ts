import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSettings, getVisit } from "@/lib/data";
import { A4, COLORS, MARGIN, embedImage, newDocument, paragraph, pdfResponse, text } from "@/lib/pdf";
import { kindLabel } from "@/lib/property-types";

export async function GET(_req: Request, ctx: RouteContext<"/app/visites/[id]/bon.pdf">) {
  const { id } = await ctx.params;
  if (!isSupabaseConfigured) return new Response("Indisponible en mode démo", { status: 404 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return new Response("Non connecté", { status: 401 });
  const [v, settings] = await Promise.all([getVisit(id), getSettings()]);
  if (!v) return new Response("Introuvable", { status: 404 });
  const a = settings.agency;

  const { doc, regular, bold } = await newDocument("Bon de visite");
  const page = doc.addPage([A4.w, A4.h]);
  const width = A4.w - MARGIN * 2;
  const fmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  let y = A4.h - MARGIN;

  text(page, a.name || "Agence", MARGIN, y - 14, bold, 15, COLORS.brand);
  paragraph(page, [a.address, a.phone, a.professionalCard && `Carte professionnelle n° ${a.professionalCard}`, a.siren && `SIREN ${a.siren}`].filter(Boolean).join("  ·  "), MARGIN, y - 32, width, regular, 9, COLORS.muted);
  y -= 90;
  text(page, "BON DE VISITE", MARGIN, y, bold, 22);
  y -= 40;

  const rows: [string, string][] = [
    ["Visiteur", v.signerName ?? v.buyerName ?? ""],
    ["Bien visité", `${kindLabel(v.propertyKind)} - ${v.propertyTitle}`],
    ["Adresse", [v.propertyAddress, v.propertyCity].filter(Boolean).join(", ")],
    ["Date et heure", fmt.format(new Date(v.startsAt))],
    ["Agent", settings.fullName],
  ];
  for (const [k, val] of rows) {
    text(page, k, MARGIN, y, regular, 11, COLORS.muted);
    y = paragraph(page, val, MARGIN + 130, y, width - 130, bold, 11) - 8;
  }
  y -= 16;
  y = paragraph(
    page,
    `Je soussigné(e) ${v.signerName ?? v.buyerName ?? ""} reconnais avoir visité le bien désigné ci-dessus par l'intermédiaire de l'agence ${a.name}, et m'engage à ne pas traiter l'acquisition de ce bien directement avec le propriétaire ou par l'intermédiaire d'un tiers, sans le concours de l'agence.`,
    MARGIN, y, width, regular, 11, COLORS.ink, 1.5,
  ) - 24;

  if (v.voucherSigned && v.signaturePath) {
    text(page, `Signé le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date())}`, MARGIN, y, regular, 10, COLORS.muted);
    const { data } = await supabase.storage.from("property-documents").download(v.signaturePath);
    const img = data ? await embedImage(doc, await data.arrayBuffer()) : null;
    if (img) {
      const w = 220;
      const h = (img.height / img.width) * w;
      page.drawImage(img, { x: MARGIN, y: y - 20 - h, width: w, height: h });
      text(page, v.signerName ?? "", MARGIN, y - 36 - h, bold, 10);
    }
  } else {
    text(page, "Signature du visiteur :", MARGIN, y, regular, 11, COLORS.muted);
    page.drawRectangle({ x: MARGIN, y: y - 110, width: 260, height: 90, borderColor: COLORS.line, borderWidth: 1 });
  }
  return pdfResponse(await doc.save(), "bon-de-visite.pdf");
}
