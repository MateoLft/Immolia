import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProperty, getSettings, listGeneratedContents } from "@/lib/data";
import { A4, COLORS, MARGIN, drawCover, embedImage, energyScale, newDocument, paragraph, pdfResponse, text } from "@/lib/pdf";
import { formatEuros, formatNumber, kindLabel } from "@/lib/property-types";

/** Plaquette commerciale du bien (PDF A4, 2 pages max) aux couleurs de l'agence. */
export async function GET(_req: Request, ctx: RouteContext<"/app/biens/[id]/plaquette.pdf">) {
  const { id } = await ctx.params;
  if (!isSupabaseConfigured) return new Response("Indisponible en mode démo", { status: 404 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return new Response("Non connecté", { status: 401 });

  const p = await getProperty(id);
  if (!p) return new Response("Bien introuvable", { status: 404 });
  const [settings, contents, { data: photoRows }] = await Promise.all([
    getSettings(),
    listGeneratedContents(p.id),
    supabase.from("property_photos").select("storage_path").eq("property_id", p.id).order("position").limit(5),
  ]);
  const description = p.publicDescription ?? contents.find((c) => c.kind === "annonce")?.content ?? "";
  const agency = settings.agency;

  const { doc, regular, bold } = await newDocument(p.title);
  const images = await Promise.all(
    (photoRows ?? []).map(async (r) => {
      const { data } = await supabase.storage.from("property-photos").download(r.storage_path);
      return data ? embedImage(doc, await data.arrayBuffer()) : null;
    }),
  );

  const width = A4.w - MARGIN * 2;
  const page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - MARGIN;

  // En-tête agence
  text(page, agency.name || settings.fullName, MARGIN, y - 12, bold, 14, COLORS.brand);
  const contact = [agency.phone || settings.phone, agency.email || settings.email].filter(Boolean).join("  ·  ");
  if (contact) text(page, contact, A4.w - MARGIN - regular.widthOfTextAtSize(contact, 9), y - 10, regular, 9, COLORS.muted);
  y -= 30;

  // Photo principale
  const coverH = 300;
  drawCover(page, images[0] ?? null, MARGIN, y - coverH, width, coverH);
  y -= coverH + 26;

  // Titre, lieu, prix
  text(page, p.title, MARGIN, y, bold, 20);
  if (p.price) {
    const price = formatEuros(p.price);
    text(page, price, A4.w - MARGIN - bold.widthOfTextAtSize(price, 20), y, bold, 20, COLORS.brand);
  }
  y -= 18;
  text(page, [p.postalCode, p.city].filter(Boolean).join(" "), MARGIN, y, regular, 11, COLORS.muted);
  y -= 26;

  // Caractéristiques
  const facts: [string, string][] = [
    ["Type", kindLabel(p.kind)],
    ["Surface", p.surface ? `${formatNumber(p.surface)} m²` : "-"],
    ["Pièces", p.rooms ? String(p.rooms) : "-"],
    ["Chambres", p.bedrooms !== null ? String(p.bedrooms) : "-"],
    ["Étage", p.floor ?? "-"],
    ["Charges / an", p.annualCharges ? formatEuros(p.annualCharges) : "-"],
  ];
  const colW = width / 3;
  facts.forEach(([k, v], i) => {
    const cx = MARGIN + (i % 3) * colW;
    const cy = y - Math.floor(i / 3) * 36;
    text(page, k, cx, cy, regular, 9, COLORS.muted);
    text(page, v.length > 28 ? `${v.slice(0, 27)}...` : v, cx, cy - 14, bold, 11);
  });
  y -= 36 * 2 + 10;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: A4.w - MARGIN, y }, thickness: 1, color: COLORS.line });
  y -= 22;

  // Description (sur la place restante de la page 1, suite en page 2 si besoin)
  const footerTop = MARGIN + 90;
  let rest = description;
  if (description) {
    const lines = description.split(/\n/);
    const fit: string[] = [];
    let cy = y;
    for (const line of lines) {
      const needed = Math.max(1, Math.ceil(regular.widthOfTextAtSize(line, 10.5) / width)) * 15;
      if (cy - needed < footerTop) break;
      fit.push(line);
      cy -= needed;
    }
    paragraph(page, fit.join("\n"), MARGIN, y, width, regular, 10.5, COLORS.ink);
    rest = lines.slice(fit.length).join("\n").trim();
  }

  // Étiquettes énergie et pied de page
  energyScale(page, "DPE - consommation énergétique", p.dpe, MARGIN, MARGIN + 70, { regular, bold });
  energyScale(page, "GES - émissions de gaz à effet de serre", p.ges, MARGIN + width / 2, MARGIN + 70, { regular, bold });
  const legal = [agency.feeText, agency.professionalCard && `Carte professionnelle n° ${agency.professionalCard}`, agency.address].filter(Boolean).join("  ·  ") || "Document non contractuel.";
  paragraph(page, `${legal}  ·  Document non contractuel.`, MARGIN, MARGIN - 4, width, regular, 7.5, COLORS.muted, 1.3);

  // Page 2 : suite de la description et autres photos
  const others = images.slice(1).filter(Boolean);
  if (rest || others.length > 0) {
    const p2 = doc.addPage([A4.w, A4.h]);
    let y2 = A4.h - MARGIN;
    text(p2, p.title, MARGIN, y2 - 12, bold, 12, COLORS.muted);
    y2 -= 34;
    if (rest) y2 = paragraph(p2, rest, MARGIN, y2, width, regular, 10.5, COLORS.ink) - 10;
    const gw = (width - 12) / 2;
    const gh = gw * 0.72;
    others.slice(0, 4).forEach((img, i) => {
      const gx = MARGIN + (i % 2) * (gw + 12);
      const gy = y2 - gh - Math.floor(i / 2) * (gh + 12);
      if (gy > MARGIN) drawCover(p2, img, gx, gy, gw, gh);
    });
  }

  const bytes = await doc.save();
  return pdfResponse(bytes, "plaquette.pdf");
}
