import { test } from "node:test";
import assert from "node:assert/strict";
import { parseImport, parseCsv } from "../../src/lib/csv-import.ts";
import { visitIcs } from "../../src/lib/ics.ts";
import { buildVisitEmail, whenLabel } from "../../src/lib/visit-email.ts";

test("CSV : export Excel français (point-virgule, BOM, guillemets, prix avec espaces)", () => {
  const csv = '﻿Titre;Ville;Code postal;Type de bien;Prix de vente;Surface habitable;Pièces;DPE;Statut;Fin de mandat\r\n' +
    '"T3 lumineux; balcon";Lyon;69003;Appartement;"250 000 €";65,5;3;D;En ligne;31/12/2026\r\n' +
    ';Bordeaux;33000;Maison;"1 250 000";120;6;"classe B";;\r\n';
  const r = parseImport(csv);
  assert.equal(r.fatal, undefined);
  assert.equal(r.delimiter, ";");
  assert.equal(r.rows.length, 2);
  assert.equal(r.rows[0].title, "T3 lumineux; balcon");
  assert.equal(r.rows[0].price_eur, 250000);
  assert.equal(r.rows[0].surface_m2, 65.5);
  assert.equal(r.rows[0].status, "en-ligne");
  assert.equal(r.rows[0].mandate_end, "2026-12-31");
  assert.equal(r.rows[1].price_eur, 1250000);
  assert.equal(r.rows[1].dpe, "B");
  assert.equal(r.rows[1].property_type, "maison");
  assert.match(r.rows[1].title, /Maison · 6 pièces · 120 m² · Bordeaux/);
  assert.ok(r.warnings.some((w) => w.line === 3 && /Titre manquant/.test(w.message)));
});

test("CSV : virgule, cellule multi-lignes, ligne sans ville écartée, doublon de référence écarté", () => {
  const csv = 'title,city,reference,description\n"A","Paris","R1","ligne 1\nligne 2"\n"B","","R2","x"\n"C","Nice","r1","doublon"\n';
  const r = parseImport(csv);
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].description, "ligne 1\nligne 2");
  assert.deepEqual(r.errors.map((e) => e.line), [3, 4]);
});

test("CSV : colonne ville absente, fichier vide, trop de lignes", () => {
  assert.match(parseImport("titre;prix\nA;1").fatal, /Ville/);
  assert.match(parseImport("   ").fatal, /vide/);
  const big = "ville\n" + "Paris\n".repeat(501);
  assert.match(parseImport(big).fatal, /limite/);
});

test("CSV : valeurs invalides ignorées avec remarque, sans bloquer", () => {
  const r = parseImport("ville;prix;dpe;type\nLyon;abc;Z;Château");
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].price_eur, null);
  assert.equal(r.rows[0].dpe, null);
  assert.ok(r.warnings.length >= 3);
});

test("parseCsv : guillemets doublés", () => {
  assert.deepEqual(parseCsv('a;"b ""c"" d"\n', ";"), [["a", 'b "c" d']]);
});

test("ICS : fuseau UTC, échappement, repliement des lignes longues", () => {
  const ics = visitIcs({ uid: "abc", startsAt: new Date("2026-11-17T13:30:00Z"), summary: "Visite : T3, Lyon", location: "1 rue A; Lyon", description: "x".repeat(200), now: new Date("2026-11-13T08:00:00Z") });
  assert.match(ics, /DTSTART:20261117T133000Z/);
  assert.match(ics, /DTEND:20261117T141500Z/);
  assert.match(ics, /SUMMARY:Visite : T3\\, Lyon/);
  assert.match(ics, /LOCATION:1 rue A\; Lyon/);
  for (const line of ics.split("\r\n")) assert.ok(line.length <= 75);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
});

test("e-mail de visite : date à Paris, échappement HTML, rappel", () => {
  assert.equal(whenLabel(new Date("2026-11-17T13:30:00Z")), "mardi 17 novembre 2026 à 14 h 30");
  assert.equal(whenLabel(new Date("2026-07-01T08:00:00Z")), "mercredi 1 juillet 2026 à 10 h");
  const m = buildVisitEmail({ kind: "confirmation", buyerName: "Marie Dupont", propertyTitle: "T3 <b>", propertyAddress: "1 rue A", city: "Lyon", startsAt: new Date("2026-11-17T13:30:00Z"), agentName: "Paul", agentPhone: "06 00 00 00 00", agencyName: "Agence X" });
  assert.match(m.subject, /^Confirmation de visite/);
  assert.match(m.text, /Bonjour Marie,/);
  assert.ok(!m.html.includes("<b>"));
  assert.match(m.html, /T3 &lt;b&gt;/);
  assert.match(buildVisitEmail({ kind: "rappel", buyerName: null, propertyTitle: "X", propertyAddress: null, city: "Nice", startsAt: new Date(), agentName: "P", agentPhone: null, agencyName: "" }).subject, /^Rappel/);
});
