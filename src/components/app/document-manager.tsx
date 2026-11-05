"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CheckCircle2, Circle, FileUp, Loader2, Sparkles, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteDocument, prepareDocumentUpload, registerDocument, runDocumentAnalysis } from "@/app/app/biens/documents-actions";
import type { DocumentKind, PropertyDocument } from "@/lib/documents";

const MAX_BYTES = 20 * 1024 * 1024;
const btn = "flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas disabled:opacity-60";

function UploadButton({ propertyId, kind, onError }: { propertyId: string; kind: string; onError: (e: string) => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) return onError("Fichier trop volumineux (20 Mo maximum).");
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) return onError("Formats acceptés : PDF, JPEG, PNG.");
    setBusy(true);
    const prep = await prepareDocumentUpload(propertyId);
    if (!prep.ok) {
      setBusy(false);
      return onError(prep.error);
    }
    const safe = file.name.normalize("NFD").replace(/[^\w.-]+/g, "-").slice(-80);
    const path = `${prep.folder}/${crypto.randomUUID()}-${safe}`;
    const { error } = await createClient().storage.from("property-documents").upload(path, file, { contentType: file.type });
    if (error) {
      setBusy(false);
      return onError("L'envoi a échoué. Le script 0007 a-t-il été exécuté dans Supabase ?");
    }
    const res = await registerDocument(propertyId, kind, path, file.name);
    if (!res.ok) onError(res.error);
    setBusy(false);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <label className={clsx(btn, "cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600", busy && "pointer-events-none opacity-60")}>
      {busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <FileUp aria-hidden className="size-4" />}
      {busy ? "Envoi…" : "Ajouter"}
      <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
    </label>
  );
}

function DocumentRow({ doc, analyzable, aiReady }: { doc: PropertyDocument; analyzable: boolean; aiReady: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Action impossible.");
      router.refresh();
    });

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {doc.url ? (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-sm font-semibold text-brand-700 underline">{doc.fileName}</a>
        ) : (
          <span className="min-w-0 truncate text-sm font-semibold">{doc.fileName}</span>
        )}
        <div className="flex flex-wrap gap-2">
          {analyzable && aiReady && (
            <button type="button" disabled={pending} onClick={() => run(() => runDocumentAnalysis(doc.id))} className={btn}>
              {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Sparkles aria-hidden className="size-4" />}
              {pending ? "Analyse… (jusqu'à 1 min)" : doc.analysis ? "Réanalyser" : "Analyser avec l'IA"}
            </button>
          )}
          <button type="button" disabled={pending} aria-label={`Supprimer ${doc.fileName}`} onClick={() => confirm("Supprimer ce document ?") && run(() => deleteDocument(doc.id))} className={btn}>
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-danger-700">{error}</p>}
      {doc.analysis && (
        <div>
          <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="text-sm font-semibold text-brand-700">
            {open ? "Masquer la synthèse de l'IA" : "Voir la synthèse de l'IA"}
          </button>
          {open && <p className="mt-2 rounded-lg bg-canvas p-3 text-sm leading-relaxed whitespace-pre-line text-body">{doc.analysis}</p>}
        </div>
      )}
    </li>
  );
}

export function DocumentManager({
  propertyId,
  kinds,
  documents,
  aiReady,
}: {
  propertyId: string;
  kinds: DocumentKind[];
  documents: PropertyDocument[];
  aiReady: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      {error && <p role="alert" className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</p>}
      <ul className="flex flex-col gap-3">
        {kinds.map((k) => {
          const docs = documents.filter((d) => d.kind === k.value);
          const done = docs.length > 0;
          return (
            <li key={k.value} className="rounded-xl border border-line bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-2.5 text-[15px] font-semibold">
                  {done ? <CheckCircle2 aria-label="fourni" className="size-5 text-success-700" /> : <Circle aria-label="manquant" className="size-5 text-line-strong" />}
                  {k.label}
                </span>
                <UploadButton propertyId={propertyId} kind={k.value} onError={setError} />
              </div>
              {docs.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {docs.map((d) => <DocumentRow key={d.id} doc={d} analyzable={Boolean(k.analyzable)} aiReady={aiReady} />)}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
