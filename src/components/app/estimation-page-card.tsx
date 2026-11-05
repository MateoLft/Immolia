"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { enableEstimationPage } from "@/app/app/estimations/actions";

export function EstimationPageCard({ url, qrSvg }: { url: string | null; qrSvg: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const snippet = url ? `<a href="${url}" target="_blank" rel="noopener">Estimez votre bien gratuitement</a>` : "";
  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Copie impossible : sélectionnez le texte manuellement.");
    }
  };
  const btn = "flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas";

  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-card">
      <h2 className="text-[17px] font-semibold">Votre page « Estimez votre bien »</h2>
      {url ? (
        <div className="mt-4 flex flex-wrap items-center gap-5">
          {qrSvg && <span role="img" aria-label="QR code de la page d'estimation" className="block size-24 flex-none rounded-lg border border-line p-1" dangerouslySetInnerHTML={{ __html: qrSvg }} />}
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <p className="truncate text-sm text-muted">{url}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => copy(url, "url")} className={btn}>{copied === "url" ? <Check aria-hidden className="size-4 text-success-700" /> : <Copy aria-hidden className="size-4" />}Copier le lien</button>
              <button type="button" onClick={() => copy(snippet, "snippet")} className={btn}>{copied === "snippet" ? <Check aria-hidden className="size-4 text-success-700" /> : <Copy aria-hidden className="size-4" />}Code pour votre site web</button>
              <a href={url} target="_blank" rel="noopener noreferrer" className={btn}><ExternalLink aria-hidden className="size-4" />Voir la page</a>
            </div>
            <p className="text-xs text-subtle">Partagez ce lien (site web, réseaux sociaux, flyers avec le QR code) : chaque demande crée un prospect vendeur.</p>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-muted">Activez une page publique où les propriétaires demandent une estimation gratuite. Les demandes arrivent ici et dans vos prospects vendeurs.</p>
          <button type="button" disabled={pending} onClick={() => start(async () => { const r = await enableEstimationPage(); if (!r.ok) setError(r.error); router.refresh(); })} className="flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60">
            {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}Activer la page
          </button>
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
    </section>
  );
}
