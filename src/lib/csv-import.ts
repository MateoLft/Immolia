/**
 * Import de biens depuis un fichier CSV (export Excel, logiciel de transaction…).
 * Module autonome (aucune dépendance) pour pouvoir être testé seul. Les listes de
 * types et de statuts reprennent celles de `property-types.ts`.
 */

export const IMPORT_MAX_ROWS = 500;
export const IMPORT_MAX_BYTES = 1_000_000;

const KINDS = [
  ["appartement", "Appartement"],
  ["maison", "Maison"],
  ["terrain", "Terrain"],
  ["local", "Local commercial"],
  ["immeuble", "Immeuble"],
  ["parking", "Parking / box"],
] as const;

export type ImportRow = {
  line: number;
  title: string;
  city: string;
  property_type: string;
  status: string;
  address: string | null;
  postal_code: string | null;
  reference: string | null;
  price_eur: number | null;
  surface_m2: number | null;
  rooms: number | null;
  bedrooms: number | null;
  floor: string | null;
  dpe: string | null;
  ges: string | null;
  annual_charges_eur: number | null;
  description: string | null;
  mandate_type: string | null;
  mandate_end: string | null;
};

export type Problem = { line: number; message: string };

export type ParsedImport = {
  delimiter: string;
  /** Colonnes reconnues : en-tête du fichier → champ Immolia. */
  recognized: { header: string; field: string }[];
  ignored: string[];
  rows: ImportRow[];
  /** Lignes écartées (non importées). */
  errors: Problem[];
  /** Lignes importées avec une remarque. */
  warnings: Problem[];
  fatal?: string;
};

export const FIELD_LABEL: Record<string, string> = {
  title: "Titre",
  city: "Ville",
  postal_code: "Code postal",
  address: "Adresse",
  property_type: "Type de bien",
  price: "Prix",
  surface: "Surface",
  rooms: "Pièces",
  bedrooms: "Chambres",
  floor: "Étage",
  dpe: "DPE",
  ges: "GES",
  charges: "Charges annuelles",
  reference: "Référence",
  description: "Description",
  status: "Statut",
  mandate_type: "Type de mandat",
  mandate_end: "Fin de mandat",
};

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const SYNONYMS: Record<string, string[]> = {
  title: ["titre", "titre de l annonce", "intitule", "libelle", "annonce", "designation", "title"],
  city: ["ville", "commune", "localite", "city"],
  postal_code: ["code postal", "cp", "codepostal", "postal code", "zip"],
  address: ["adresse", "adresse du bien", "rue", "address"],
  property_type: ["type", "type de bien", "nature", "categorie", "type bien", "property type"],
  price: ["prix", "prix de vente", "prix fai", "prix hai", "montant", "price", "prix eur"],
  surface: ["surface", "surface habitable", "m2", "superficie", "surface m2", "surface loi carrez", "surface carrez"],
  rooms: ["pieces", "nombre de pieces", "nb pieces", "nb de pieces", "p", "rooms"],
  bedrooms: ["chambres", "nombre de chambres", "nb chambres", "bedrooms"],
  floor: ["etage", "niveau", "floor"],
  dpe: ["dpe", "classe energie", "classe energetique", "diagnostic energetique"],
  ges: ["ges", "classe ges", "emissions ges"],
  charges: ["charges", "charges annuelles", "charges de copropriete", "charges copro"],
  reference: ["reference", "ref", "ref bien", "reference du bien", "code bien", "numero de bien"],
  description: ["description", "descriptif", "texte", "texte de l annonce", "notes", "commentaire"],
  status: ["statut", "etat", "status", "situation"],
  mandate_type: ["mandat", "type de mandat", "type mandat"],
  mandate_end: ["fin de mandat", "echeance mandat", "date fin mandat", "fin mandat", "echeance du mandat"],
};

/** Colonnes dont un seul mot suffit à les reconnaître (2ᵉ passe, si aucun nom exact ne correspond). */
const KEYWORDS: [string, string][] = [
  ["prix", "price"],
  ["surface", "surface"],
  ["ville", "city"],
  ["commune", "city"],
  ["titre", "title"],
  ["adresse", "address"],
  ["pieces", "rooms"],
  ["chambres", "bedrooms"],
  ["etage", "floor"],
  ["dpe", "dpe"],
  ["ges", "ges"],
  ["reference", "reference"],
  ["description", "description"],
  ["statut", "status"],
];

function detectDelimiter(text: string): string {
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const counts = [";", "\t", ","].map((d) => [d, first.split(d).length - 1] as const);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ";";
}

/** Lecteur CSV : guillemets, guillemets doublés, retours à la ligne dans une cellule. */
export function parseCsv(input: string, delimiter: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === delimiter) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function parseNumber(raw: string): number | null {
  let s = raw.replace(/[\s  ]/g, "").replace(/[^\d.,-]/g, "");
  if (!s || s === "-") return null;
  if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ""); // « 250.000 » : séparateur de milliers
  else if (/^-?\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, "");
  else s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseKind(raw: string): string | null {
  const s = norm(raw);
  if (!s) return null;
  if (/appart|studio|duplex|loft|t\d|f\d/.test(s)) return "appartement";
  if (/maison|villa|pavillon|longere|chalet/.test(s)) return "maison";
  if (/terrain|parcelle/.test(s)) return "terrain";
  if (/local|commerce|bureau|boutique|fonds/.test(s)) return "local";
  if (/immeuble|building/.test(s)) return "immeuble";
  if (/parking|garage|box|stationnement/.test(s)) return "parking";
  return null;
}

function parseStatus(raw: string): string | null {
  const s = norm(raw);
  if (!s) return null;
  if (/vendu/.test(s)) return "vendu";
  if (/compromis|promesse/.test(s)) return "compromis";
  if (/offre/.test(s)) return "offre";
  if (/archiv|retire|annule/.test(s)) return "archive";
  if (/ligne|actif|publie|diffuse|disponible/.test(s)) return "en-ligne";
  if (/publier/.test(s)) return "a-publier";
  if (/brouillon/.test(s)) return "brouillon";
  return null;
}

function parseMandate(raw: string): string | null {
  const s = norm(raw);
  if (/semi/.test(s)) return "semi-exclusif";
  if (/exclusif/.test(s)) return "exclusif";
  if (/simple/.test(s)) return "simple";
  return null;
}

function parseDate(raw: string): string | null {
  const s = raw.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  let y: number, mo: number, d: number;
  if (m) [y, mo, d] = [+m[1], +m[2], +m[3]];
  else if ((m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s))) [d, mo, y] = [+m[1], +m[2], +m[3]];
  else return null;
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseEnergy(raw: string): string | null {
  const m = /(?:^|[^a-z])([A-G])(?:[^a-z]|$)/i.exec(raw.trim());
  return m ? m[1].toUpperCase() : null;
}

const clip = (s: string, n: number) => s.replace(/\s+/g, " ").trim().slice(0, n);

export function parseImport(text: string): ParsedImport {
  const empty: ParsedImport = { delimiter: ";", recognized: [], ignored: [], rows: [], errors: [], warnings: [] };
  if (!text.trim()) return { ...empty, fatal: "Le fichier est vide." };

  const delimiter = detectDelimiter(text);
  const table = parseCsv(text, delimiter).filter((r) => r.some((c) => c.trim() !== ""));
  if (table.length < 2) return { ...empty, delimiter, fatal: "Le fichier doit contenir une ligne d'en-têtes puis au moins un bien." };

  const headers = table[0].map((h) => h.trim());
  const normalized = headers.map(norm);
  const mapping = new Map<number, string>();
  const taken = new Set<string>();

  // 1. noms exacts
  normalized.forEach((h, i) => {
    for (const [field, names] of Object.entries(SYNONYMS)) {
      if (!taken.has(field) && names.includes(h)) {
        mapping.set(i, field);
        taken.add(field);
        break;
      }
    }
  });
  // 2. mots-clés
  normalized.forEach((h, i) => {
    if (mapping.has(i)) return;
    const words = h.split(" ");
    const hit = KEYWORDS.find(([w, field]) => words.includes(w) && !taken.has(field));
    if (hit) {
      mapping.set(i, hit[1]);
      taken.add(hit[1]);
    }
  });

  const recognized = [...mapping.entries()].map(([i, field]) => ({ header: headers[i], field }));
  const ignored = headers.filter((_, i) => !mapping.has(i) && headers[i] !== "");
  if (!taken.has("city")) {
    return { ...empty, delimiter, recognized, ignored, fatal: "Colonne « Ville » introuvable : elle est obligatoire (en-tête attendu : Ville, Commune…)." };
  }

  const colOf = Object.fromEntries([...mapping.entries()].map(([i, f]) => [f, i]));
  const get = (r: string[], field: string) => (colOf[field] === undefined ? "" : (r[colOf[field]] ?? "").trim());

  const rows: ImportRow[] = [];
  const errors: Problem[] = [];
  const warnings: Problem[] = [];
  const refs = new Set<string>();
  const body = table.slice(1);

  if (body.length > IMPORT_MAX_ROWS) {
    return { ...empty, delimiter, recognized, ignored, fatal: `Le fichier contient ${body.length} lignes : la limite est de ${IMPORT_MAX_ROWS} biens par import. Découpez-le en plusieurs fichiers.` };
  }

  body.forEach((r, idx) => {
    const line = idx + 2;
    const warn = (message: string) => warnings.push({ line, message });
    const city = clip(get(r, "city"), 120);
    if (!city) return void errors.push({ line, message: "Ville manquante" });

    const kindRaw = get(r, "property_type");
    const kind = parseKind(kindRaw);
    if (kindRaw && !kind) warn(`Type « ${clip(kindRaw, 30)} » non reconnu : « Appartement » par défaut`);

    const num = (field: string, label: string, opts: { max: number; int?: boolean }): number | null => {
      const raw = get(r, field);
      if (!raw) return null;
      const n = parseNumber(raw);
      if (n === null || n < 0 || n > opts.max) {
        warn(`${label} « ${clip(raw, 20)} » ignoré (valeur invalide)`);
        return null;
      }
      return opts.int ? Math.round(n) : Math.round(n * 100) / 100;
    };
    const price = num("price", "Prix", { max: 1_000_000_000, int: true });
    const surface = num("surface", "Surface", { max: 100_000 });
    if (surface === 0) warn("Surface nulle ignorée");
    const rooms = num("rooms", "Pièces", { max: 100, int: true });
    const bedrooms = num("bedrooms", "Chambres", { max: 100, int: true });
    const charges = num("charges", "Charges", { max: 10_000_000, int: true });

    const statusRaw = get(r, "status");
    const status = parseStatus(statusRaw);
    if (statusRaw && !status) warn(`Statut « ${clip(statusRaw, 30)} » non reconnu : « Brouillon » par défaut`);

    const dpeRaw = get(r, "dpe");
    const dpe = dpeRaw ? parseEnergy(dpeRaw) : null;
    if (dpeRaw && !dpe) warn(`DPE « ${clip(dpeRaw, 20)} » ignoré (lettre A à G attendue)`);
    const gesRaw = get(r, "ges");
    const ges = gesRaw ? parseEnergy(gesRaw) : null;
    if (gesRaw && !ges) warn(`GES « ${clip(gesRaw, 20)} » ignoré (lettre A à G attendue)`);

    const mandateRaw = get(r, "mandate_type");
    const mandate = mandateRaw ? parseMandate(mandateRaw) : null;
    if (mandateRaw && !mandate) warn(`Mandat « ${clip(mandateRaw, 30)} » non reconnu`);
    const endRaw = get(r, "mandate_end");
    const end = endRaw ? parseDate(endRaw) : null;
    if (endRaw && !end) warn(`Date de fin de mandat « ${clip(endRaw, 20)} » ignorée (format JJ/MM/AAAA attendu)`);

    const reference = clip(get(r, "reference"), 60) || null;
    if (reference) {
      if (refs.has(reference.toLowerCase())) return void errors.push({ line, message: `Référence « ${reference} » en double dans le fichier` });
      refs.add(reference.toLowerCase());
    }

    const propertyType = kind ?? "appartement";
    let title = clip(get(r, "title"), 200);
    if (!title) {
      const label = KINDS.find(([v]) => v === propertyType)?.[1] ?? "Bien";
      title = [label, rooms ? `${rooms} pièces` : null, surface ? `${String(surface).replace(".", ",")} m²` : null, city].filter(Boolean).join(" · ");
      warn("Titre manquant : généré automatiquement");
    }

    rows.push({
      line,
      title,
      city,
      property_type: propertyType,
      status: status ?? "brouillon",
      address: clip(get(r, "address"), 200) || null,
      postal_code: clip(get(r, "postal_code"), 10) || null,
      reference,
      price_eur: price,
      surface_m2: surface && surface > 0 ? surface : null,
      rooms,
      bedrooms,
      floor: clip(get(r, "floor"), 30) || null,
      dpe,
      ges,
      annual_charges_eur: charges,
      description: get(r, "description").slice(0, 5000) || null,
      mandate_type: mandate,
      mandate_end: end,
    });
  });

  return { delimiter, recognized, ignored, rows, errors, warnings };
}
