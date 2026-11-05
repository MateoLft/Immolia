import "server-only";
import { PDFDocument, StandardFonts, clip, endPath, popGraphicsState, pushGraphicsState, rectangle, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";

/** Outils de mise en page PDF (A4, polices standard) partagés par les documents Immolia. */

export const A4 = { w: 595.28, h: 841.89 };
export const MARGIN = 48;
export const COLORS = {
  ink: rgb(0.063, 0.094, 0.157),
  muted: rgb(0.278, 0.329, 0.404),
  line: rgb(0.918, 0.925, 0.941),
  brand: rgb(0.275, 0.329, 0.941),
  canvas: rgb(0.976, 0.98, 0.984),
};

const ENERGY: Record<string, [number, number, number]> = {
  A: [0, 0.612, 0.427],
  B: [0.322, 0.694, 0.325],
  C: [0.471, 0.741, 0.463],
  D: [0.957, 0.906, 0.059],
  E: [0.941, 0.706, 0.059],
  F: [0.922, 0.51, 0.208],
  G: [0.843, 0.133, 0.122],
};

/** Les polices standard ne gèrent que le jeu WinAnsi : on remplace le reste. */
export function clean(text: string) {
  return text
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[  ]/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ€ŒœŸ]/g, "");
}

export function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of clean(text).split(/\n/)) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

export async function newDocument(title: string) {
  const doc = await PDFDocument.create();
  doc.setTitle(clean(title));
  doc.setCreator("Immolia");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  return { doc, regular, bold };
}

export function text(page: PDFPage, value: string, x: number, y: number, font: PDFFont, size: number, color: RGB = COLORS.ink) {
  page.drawText(clean(value), { x, y, size, font, color });
}

/** Paragraphe avec retour à la ligne ; renvoie la position y sous le texte. */
export function paragraph(page: PDFPage, value: string, x: number, y: number, width: number, font: PDFFont, size: number, color: RGB = COLORS.ink, leading = 1.45) {
  let cy = y;
  for (const line of wrap(value, font, size, width)) {
    if (line) page.drawText(line, { x, y: cy, size, font, color });
    cy -= size * leading;
  }
  return cy;
}

export function energyScale(page: PDFPage, label: string, value: string | null, x: number, y: number, fonts: { regular: PDFFont; bold: PDFFont }) {
  text(page, label, x, y, fonts.bold, 9, COLORS.muted);
  const box = 22;
  "ABCDEFG".split("").forEach((c, i) => {
    const [r, g, b] = ENERGY[c];
    const active = c === value;
    page.drawRectangle({ x: x + i * (box + 3), y: y - box - 6, width: box, height: box, color: rgb(r, g, b), opacity: active ? 1 : 0.3, borderColor: active ? COLORS.ink : undefined, borderWidth: active ? 1.5 : 0 });
    const dark = "BCDEF".includes(c);
    text(page, c, x + i * (box + 3) + 7.5, y - box + 1, fonts.bold, 11, dark ? COLORS.ink : rgb(1, 1, 1));
  });
  if (!value) text(page, "Non communiqué", x, y - box - 20, fonts.regular, 9, COLORS.muted);
}

/** Intègre une image JPEG ou PNG (détection par l'en-tête du fichier). */
export async function embedImage(doc: PDFDocument, bytes: ArrayBuffer) {
  const head = new Uint8Array(bytes.slice(0, 4));
  try {
    if (head[0] === 0x89 && head[1] === 0x50) return await doc.embedPng(bytes);
    return await doc.embedJpg(bytes);
  } catch {
    return null;
  }
}

/** Dessine une image en « cover » dans un cadre (recadrage centré). */
export function drawCover(page: PDFPage, img: Awaited<ReturnType<typeof embedImage>>, x: number, y: number, w: number, h: number) {
  if (!img) {
    page.drawRectangle({ x, y, width: w, height: h, color: COLORS.canvas });
    return;
  }
  const scale = Math.max(w / img.width, h / img.height);
  const iw = img.width * scale;
  const ih = img.height * scale;
  // On centre l'image et on masque les débords avec un chemin de découpe.
  page.pushOperators(pushGraphicsState(), rectangle(x, y, w, h), clip(), endPath());
  page.drawImage(img, { x: x + (w - iw) / 2, y: y + (h - ih) / 2, width: iw, height: ih });
  page.pushOperators(popGraphicsState());
}

export function pdfResponse(bytes: Uint8Array, filename: string) {
  return new Response(bytes as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
