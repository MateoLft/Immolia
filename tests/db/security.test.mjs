// Tests de sécurité de la base : deux agences, un agent, un visiteur anonyme.
// Lancer avec `npm test` (base Postgres embarquée, aucune connexion externe).
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { parseImport } from "../../src/lib/csv-import.ts";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../supabase/migrations");
const A = "aaaaaaaa-0000-0000-0000-000000000001";
const A2 = "aaaaaaaa-0000-0000-0000-000000000002";
const B = "bbbbbbbb-0000-0000-0000-000000000001";
const TOKEN = "c".repeat(40);

let db, agA, agB, propA, propB, buyerB;

const as = async (uid, sql) => {
  await db.exec(`reset role; select set_config('test.uid','${uid}',false); set role ${uid ? "authenticated" : "anon"};`);
  try { return await db.query(sql); } finally { await db.exec("reset role;"); }
};
const fails = async (uid, sql) => { try { await as(uid, sql); return false; } catch { return true; } };
const one = async (sql) => (await db.query(sql)).rows[0];

before(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users (id uuid primary key, raw_user_meta_data jsonb, email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
    create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
    alter table storage.objects enable row level security;`);
  for (const f of fs.readdirSync(dir).sort()) await db.exec(fs.readFileSync(path.join(dir, f), "utf8"));
  await db.exec(`grant usage on schema public, storage, auth to anon, authenticated;
    grant all on all tables in schema public to anon, authenticated;
    grant all on all sequences in schema public to anon, authenticated;
    grant all on storage.objects to anon, authenticated;
    grant execute on all functions in schema public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    grant select on auth.users to authenticated;`);
  await db.exec(`insert into auth.users values
    ('${A}','{"full_name":"Alice","agency_name":"Agence A"}','a@a.fr'),
    ('${B}','{"full_name":"Bob","agency_name":"Agence B"}','b@b.fr')`);
  agA = (await one(`select agency_id from profiles where id='${A}'`)).agency_id;
  agB = (await one(`select agency_id from profiles where id='${B}'`)).agency_id;
  await db.exec(`insert into agency_invitations (agency_id,email,role,token) values ('${agA}','a2@a.fr','agent','${TOKEN}');
    insert into auth.users values ('${A2}','{"full_name":"Agent A2","invitation_token":"${TOKEN}"}','a2@a.fr')`);
  await db.exec(`insert into properties (agency_id, agent_id, title, city, status, address) values
      ('${agA}','${A}','Bien de A','Lyon','en-ligne','1 rue A'),
      ('${agB}','${B}','Bien de B','Paris','en-ligne','10 rue secrète');
    insert into buyers (agency_id, full_name, phone) values ('${agB}','Acheteur de B','0600000000')`);
  propA = (await one(`select id from properties where agency_id='${agA}'`)).id;
  propB = (await one(`select id from properties where agency_id='${agB}'`)).id;
  buyerB = (await one(`select id from buyers where agency_id='${agB}'`)).id;
});

test("isolation en lecture entre agences", async () => {
  for (const [t, col] of [["properties", "agency_id"], ["buyers", "agency_id"], ["profiles", "agency_id"], ["agencies", "id"], ["subscriptions", "agency_id"]]) {
    const r = await as(A, `select count(*)::int n from ${t} where ${col} = '${agB}'`);
    assert.equal(r.rows[0].n, 0, t);
  }
});

test("le visiteur anonyme ne lit aucune table et n'écrit pas en direct", async () => {
  for (const t of ["properties", "buyers", "visits", "profiles", "mandates", "visit_requests", "agency_invitations", "ai_usage"]) {
    assert.equal((await as("", `select count(*)::int n from ${t}`)).rows[0].n, 0, t);
  }
  assert.ok(await fails("", `insert into visit_requests (agency_id, property_id, full_name) values ('${agB}','${propB}','spam')`));
});

test("pas d'écriture dans une autre agence", async () => {
  assert.ok(await fails(A, `insert into properties (agency_id, title, city) values ('${agB}','Intrus','X')`));
  await as(A, `update properties set title='piraté' where id='${propB}'`);
  assert.equal((await one(`select title from properties where id='${propB}'`)).title, "Bien de B");
});

test("références croisées entre agences refusées", async () => {
  assert.ok(await fails(A, `insert into visits (property_id, buyer_id, starts_at) values ('${propB}','${buyerB}', now())`));
  assert.ok(await fails(A, `insert into visits (property_id, starts_at) values ('${propB}', now())`));
  assert.ok(await fails(A, `insert into generated_contents (property_id, kind, tone, content) values ('${propB}','annonce','premium','x')`));
  assert.ok(await fails(A, `insert into mandates (property_id, seller_name, property_label, type, signed_on) values ('${propB}','x','x','simple','2026-01-01')`));
  // une référence légitime reste acceptée
  await as(A, `insert into visits (property_id, starts_at) values ('${propA}', now())`);
});

test("rôles : pas d'escalade, abonnement et agence protégés", async () => {
  assert.ok(await fails(A2, `update profiles set role='owner' where id='${A2}'`));
  assert.ok(await fails(A2, `update profiles set email='autre@x.fr' where id='${A2}'`));
  await as(A2, `update agencies set name='renommée' where id='${agA}'`);
  assert.equal((await one(`select name from agencies where id='${agA}'`)).name, "Agence A");
  await as(A, `update subscriptions set plan='agence' where agency_id='${agA}'`);
  assert.equal((await one(`select plan from subscriptions where agency_id='${agA}'`)).plan, "pro");
});

test("un agent ne peut pas supprimer un bien, le responsable le peut", async () => {
  await as(A2, `delete from properties where id='${propA}'`);
  assert.equal((await one(`select count(*)::int n from properties where id='${propA}'`)).n, 1);
  await db.exec(`insert into properties (agency_id, agent_id, title, city) values ('${agA}','${A}','Jetable','Lyon')`);
  await as(A, `delete from properties where title='Jetable'`);
  assert.equal((await one(`select count(*)::int n from properties where title='Jetable'`)).n, 0);
});

test("registre des mandats : numérotation continue, immuable, sans suppression", async () => {
  await as(A, `insert into mandates (seller_name, property_label, type, signed_on) values ('M. Un','Bien','simple','2026-01-01'),('M. Deux','Bien','simple','2026-01-02')`);
  const nums = (await db.query(`select number from mandates where agency_id='${agA}' order by number`)).rows.map((r) => r.number);
  assert.deepEqual(nums, [1, 2]);
  assert.ok(await fails(A, `update mandates set number = 99 where number = 1`));
  await as(A2, `delete from mandates`);
  assert.equal((await one(`select count(*)::int n from mandates where agency_id='${agA}'`)).n, 2);
});

test("stockage cloisonné et jetons d'invitation invisibles pour un agent", async () => {
  assert.ok(await fails(A, `insert into storage.objects (bucket_id, name) values ('property-photos','${agB}/x/pirate.jpg')`));
  assert.equal((await as(A2, `select count(*)::int n from agency_invitations`)).rows[0].n, 0);
});

test("quota IA : plafond journalier appliqué par agence", async () => {
  for (let i = 0; i < 60; i++) assert.equal((await as(A, `select public.consume_ai_quota('studio') r`)).rows[0].r, "ok");
  assert.equal((await as(A, `select public.consume_ai_quota('studio') r`)).rows[0].r, "jour");
  assert.equal((await as(B, `select public.consume_ai_quota('studio') r`)).rows[0].r, "ok"); // l'autre agence n'est pas touchée
  // un visiteur anonyme n'obtient jamais d'autorisation (refus, ou fonction non exécutable)
  const anon = await as("", `select public.consume_ai_quota('studio') r`).then((r) => r.rows[0].r, () => "refuse");
  assert.equal(anon, "refuse");
  assert.ok(await fails(A, `insert into ai_usage (agency_id, kind) values ('${agA}','x')`)); // pas de triche directe
});

test("statistiques d'équipe en SQL, limitées à l'agence", async () => {
  const rows = (await as(A, `select * from public.get_member_stats()`)).rows;
  assert.ok(rows.length > 0);
  assert.equal(rows.reduce((s, r) => s + r.properties, 0), 1); // un seul bien actif dans l'agence A
});

test("photo principale : réordonnancement atomique", async () => {
  await db.exec(`insert into property_photos (property_id, agency_id, storage_path, position) values
    ('${propA}','${agA}','${agA}/a.jpg',0),('${propA}','${agA}','${agA}/b.jpg',1),('${propA}','${agA}','${agA}/c.jpg',2)`);
  const c = (await one(`select id from property_photos where storage_path='${agA}/c.jpg'`)).id;
  await as(A, `select public.set_cover_photo('${c}')`);
  const order = (await db.query(`select storage_path from property_photos where property_id='${propA}' order by position`)).rows.map((r) => r.storage_path.split("/")[1]);
  assert.deepEqual(order, ["c.jpg", "a.jpg", "b.jpg"]);
});

test("visites : les notes de préparation ne sont plus écrasées par le compte rendu", async () => {
  await as(A, `insert into visits (property_id, starts_at, notes) values ('${propA}', now(), 'Clés chez le gardien')`);
  const id = (await one(`select id from visits where notes = 'Clés chez le gardien'`)).id;
  await as(A, `update visits set status='realisee', feedback='Très intéressé' where id='${id}'`);
  const v = await one(`select notes, feedback from visits where id='${id}'`);
  assert.equal(v.notes, "Clés chez le gardien");
  assert.equal(v.feedback, "Très intéressé");
});

test("e-mails : plafond propre, indépendant de celui de l'IA, par agence", async () => {
  for (let i = 0; i < 40; i++) assert.equal((await as(B, `select public.consume_email_quota() r`)).rows[0].r, "ok");
  assert.equal((await as(B, `select public.consume_email_quota() r`)).rows[0].r, "jour");
  // l'IA de la même agence n'est pas bloquée par les e-mails
  assert.equal((await as(B, `select public.consume_ai_quota('studio') r`)).rows[0].r, "ok");
  // l'agence A n'est pas touchée
  assert.equal((await as(A2, `select public.consume_email_quota() r`)).rows[0].r, "ok");
  const anon = await as("", `select public.consume_email_quota() r`).then((r) => r.rows[0].r, () => "refuse");
  assert.equal(anon, "refuse");
});

test("import CSV : le fichier modèle est accepté par la base, dans l'agence de l'utilisateur", async () => {
  const file = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../public/modele-import-biens.csv");
  const parsed = parseImport(fs.readFileSync(file, "utf8"));
  assert.equal(parsed.rows.length, 2);
  await db.exec(`reset role; select set_config('test.uid','${A}',false); set role authenticated;`);
  try {
    for (const row of parsed.rows) {
      const cols = Object.keys(row).filter((c) => c !== "line");
      const marks = cols.map((_, i) => "$" + (i + 1)).join(", ");
      await db.query(`insert into properties (agent_id, ${cols.join(", ")}) values ('${A}', ${marks})`, cols.map((c) => row[c]));
    }
  } finally {
    await db.exec("reset role;");
  }
  const n = (await one(`select count(*)::int n from properties where agency_id='${agA}' and reference in ('LY-0001','BX-0002')`)).n;
  assert.equal(n, 2);
});
