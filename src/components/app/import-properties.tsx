"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { previewImport, runImport, type ImportPreview } from "@/app/app/biens/import-actions";
import { FIELD_LABEL } from "@/lib/csv-import";
import { formatEuros, kindLabel, STATUS_LABEL, type PropertyStatus } from "@/lib/property-types";

/** Les fichiers Excel français sont souvent en Windows-1252 : on essaie l'UTF-8 puis on se rabat dessus. */
async function readText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

const btn = "flex h-11 items-center gap-2 rounded-lg px-5 text-sm font-semibold shadow-xs disabled:opacity-60";

export function ImportProperties() {
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<Extract<ImportPreview, { ok: true }> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ imported: number; skipped: number } | null>(null);
  const [pending, start] = useTransition();

  function reset() {
    setText(null);
    setPreview(null);
    setError(null);
    setDone(null);
    setFileName("");
    if (input.current) input.current.value = "";
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    reset();
    setFileName(file.name);
    start(async () => {
      const content = await readText(file);
      const res = await previewImport(content);
      if (!res.ok) return setError(res.error);
      setText(content);
      setPreview(res);
    });
  }

  function confirm() {
    if (!text) return;
    start(async () => {
      setError(null);
      const res = await runImport(text);
      if (!res.ok) return setError(res.error);
      setDone({ imported: res.imported, skipped: res.skipped });
      setPreview(null);
      setText(null);
    });
  }

  if (done) {
    return (
      <section className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white px-6 py-12 text-center shadow-card">
        <CheckCircle2 aria-hidden className="size-9 text-success-700" strokeWidth={1.6} />
        <h2 className="text-xl font-semibold">{done.imported} bien{done.imported > 1 ? "s" : ""} importé{done.imported > 1 ? "s" : ""}</h2>
        <p className="max-w-md text-sm text-muted">
          Ils sont en « Brouillon » (sauf statut indiqué dans le fichier).{done.skipped > 0 && ` ${done.skipped} ligne${done.skipped > 1 ? "s" : ""} ignorée${done.skipped > 1 ? "s" : ""} car déjà présente${done.skipped > 1 ? "s" : ""}.`} Ajoutez les photos, puis laissez l&apos;IA rédiger les annonces.
        </p>
        <div className="flex gap-3">
          <Link href="/app/biens" className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}>Voir mes biens</Link>
          <button type="button" onClick={reset} className={`${btn} border border-line-strong bg-white text-body hover:bg-canvas`}>Importer un autre fichier</button>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong bg-white px-6 py-10 text-center has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600">
        {pending && !preview ? <Loader2 aria-hidden className="size-7 animate-spin text-brand-600" /> : <FileUp aria-hidden className="size-7 text-brand-600" strokeWidth={1.6} />}
        <span className="font-semibold">{fileName || "Choisir un fichier CSV"}</span>
        <span className="text-sm text-muted">Export Excel (« CSV UTF-8 » ou « CSV »), 500 biens et 1 Mo maximum.</span>
        <input ref={input} type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" disabled={pending} onChange={(e) => onFile(e.target.files?.[0])} />
      </label>

      {error && <p role="alert" className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</p>}

      {preview && (
        <section className="rounded-xl border border-line bg-white shadow-card">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-[17px] font-semibold">Vérifiez avant d&apos;importer</h2>
            <p className="mt-0.5 text-sm text-muted">
              {preview.total} bien{preview.total > 1 ? "s" : ""} prêt{preview.total > 1 ? "s" : ""} à être importé{preview.total > 1 ? "s" : ""}
              {preview.existing > 0 && ` · ${preview.existing} déjà présent${preview.existing > 1 ? "s" : ""} (ignoré${preview.existing > 1 ? "s" : ""})`}
              {preview.errors.length > 0 && ` · ${preview.errors.length} ligne${preview.errors.length > 1 ? "s" : ""} écartée${preview.errors.length > 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex flex-col gap-4 p-5">
            <div>
              <h3 className="text-sm font-semibold">Colonnes reconnues</h3>
              <p className="mt-1 flex flex-wrap gap-1.5">
                {preview.recognized.map((c) => (
                  <span key={c.header} className="rounded-md bg-hover px-2 py-1 text-[13px] text-body">{c.header} → {FIELD_LABEL[c.field] ?? c.field}</span>
                ))}
              </p>
              {preview.ignored.length > 0 && <p className="mt-2 text-[13px] text-muted">Non utilisées : {preview.ignored.join(", ")}</p>}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[13px] text-muted">
                  <tr><th className="py-2 pr-4 font-medium">Titre</th><th className="py-2 pr-4 font-medium">Ville</th><th className="py-2 pr-4 font-medium">Type</th><th className="py-2 pr-4 font-medium">Prix</th><th className="py-2 pr-4 font-medium">Surface</th><th className="py-2 font-medium">Statut</th></tr>
                </thead>
                <tbody>
                  {preview.sample.map((r, i) => (
                    <tr key={i} className="border-t border-hover">
                      <td className="max-w-64 truncate py-2 pr-4 font-medium">{r.title}</td>
                      <td className="py-2 pr-4">{r.city}</td>
                      <td className="py-2 pr-4">{kindLabel(r.property_type)}</td>
                      <td className="py-2 pr-4">{formatEuros(r.price_eur)}</td>
                      <td className="py-2 pr-4">{r.surface_m2 ? `${r.surface_m2} m²` : "—"}</td>
                      <td className="py-2">{STATUS_LABEL[r.status as PropertyStatus]?.label ?? r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.total > preview.sample.length && <p className="mt-2 text-[13px] text-muted">… et {preview.total - preview.sample.length} autres.</p>}
            </div>

            {preview.errors.length > 0 && (
              <details className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">
                <summary className="cursor-pointer font-semibold">{preview.errors.length} ligne{preview.errors.length > 1 ? "s" : ""} écartée{preview.errors.length > 1 ? "s" : ""} (non importée{preview.errors.length > 1 ? "s" : ""})</summary>
                <ul className="mt-2 list-disc pl-5">{preview.errors.map((e, i) => <li key={i}>Ligne {e.line} : {e.message}</li>)}</ul>
              </details>
            )}
            {preview.warnings.length > 0 && (
              <details className="rounded-lg bg-warning-50 px-4 py-3 text-sm text-warning-700">
                <summary className="cursor-pointer font-semibold">{preview.warnings.length} remarque{preview.warnings.length > 1 ? "s" : ""} (les biens sont importés quand même)</summary>
                <ul className="mt-2 list-disc pl-5">{preview.warnings.map((w, i) => <li key={i}>Ligne {w.line} : {w.message}</li>)}</ul>
              </details>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-line px-5 py-4">
            <button type="button" onClick={reset} disabled={pending} className={`${btn} border border-line-strong bg-white text-body hover:bg-canvas`}>Changer de fichier</button>
            <button type="button" onClick={confirm} disabled={pending || preview.total - preview.existing === 0} className={`${btn} bg-brand-600 text-white hover:bg-brand-700`}>
              {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
              Importer {preview.total - preview.existing} bien{preview.total - preview.existing > 1 ? "s" : ""}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
