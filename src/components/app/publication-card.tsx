"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Copy, Download, ExternalLink, Globe, Loader2 } from "lucide-react";
import { savePublicDescription, setPublished } from "@/app/app/biens/publication-actions";

export function PublicationCard({
  propertyId,
  published,
  publicUrl,
  qrSvg,
  qrPng,
  publicDescription,
  latestAnnonce,
}: {
  propertyId: string;
  published: boolean;
  publicUrl: string | null;
  qrSvg: string | null;
  qrPng: string | null;
  publicDescription: string | null;
  latestAnnonce: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(publicDescription ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const res = await setPublished(propertyId, !published);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  function save(value = text) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await savePublicDescription(propertyId, value);
      if (!res.ok) setError(res.error);
      else setSaved(true);
      router.refresh();
    });
  }

  async function copyLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copie impossible : sélectionnez le lien manuellement.");
    }
  }

  return (
    <section className="rounded-xl border border-line bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Globe aria-hidden className="size-[18px] text-brand-700" />
          <h2 className="text-[17px] font-semibold">Page publique</h2>
          <span className={published ? "rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-semibold text-success-700" : "rounded-full bg-hover px-2.5 py-0.5 text-xs font-semibold text-body"}>
            {published ? "En ligne" : "Non publiée"}
          </span>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className={published
            ? "flex h-9 items-center gap-2 rounded-lg border border-line-strong px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas disabled:opacity-60"
            : "flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60"}
        >
          {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
          {published ? "Retirer la page" : "Publier la page"}
        </button>
      </div>

      <div className="flex flex-col gap-5 p-5">
        {error && <p role="alert" className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</p>}

        {published && publicUrl ? (
          <div className="flex flex-wrap items-center gap-5">
            {qrSvg && (
              <span
                role="img"
                aria-label="QR code de la page publique"
                className="block size-28 flex-none rounded-lg border border-line p-1.5"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <p className="truncate text-sm text-muted">{publicUrl}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copyLink} className="flex h-9 items-center gap-2 rounded-lg border border-line-strong px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas">
                  {copied ? <Check aria-hidden className="size-4 text-success-700" /> : <Copy aria-hidden className="size-4" />}
                  {copied ? "Lien copié" : "Copier le lien"}
                </button>
                <Link href={publicUrl} target="_blank" className="flex h-9 items-center gap-2 rounded-lg border border-line-strong px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas">
                  <ExternalLink aria-hidden className="size-4" />Voir la page
                </Link>
                {qrPng && (
                  <a href={qrPng} download="qr-code-bien.png" className="flex h-9 items-center gap-2 rounded-lg border border-line-strong px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas">
                    <Download aria-hidden className="size-4" />QR code (PNG)
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Publiez la page pour obtenir un lien à partager (SMS, WhatsApp, réseaux sociaux) et un QR code pour la vitrine. Les visiteurs peuvent y demander une visite. L&apos;adresse exacte et vos notes internes ne sont jamais affichées.
          </p>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="public-description" className="text-sm font-semibold">Texte affiché sur la page</label>
          <textarea
            id="public-description"
            value={text}
            onChange={(e) => { setText(e.target.value); setSaved(false); }}
            rows={7}
            placeholder="Le texte de l'annonce visible par les acquéreurs."
            className="w-full rounded-lg border border-line-strong p-3.5 text-[15px] leading-relaxed outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => save()} disabled={pending} className="h-9 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60">
              Enregistrer le texte
            </button>
            {latestAnnonce && (
              <button
                type="button"
                onClick={() => { setText(latestAnnonce); save(latestAnnonce); }}
                disabled={pending}
                className="h-9 rounded-lg border border-line-strong px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas disabled:opacity-60"
              >
                Reprendre la dernière annonce du Studio IA
              </button>
            )}
            {saved && <span role="status" className="text-sm text-success-700">Enregistré</span>}
          </div>
        </div>
      </div>
    </section>
  );
}
