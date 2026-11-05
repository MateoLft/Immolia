"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check, CheckCircle2, Copy, Download, ExternalLink, Loader2 } from "lucide-react";
import { setListingStatus } from "@/app/app/biens/diffusion-actions";
import type { Listing } from "@/lib/property-types";

export type PortalContent = {
  id: string;
  name: string;
  url: string;
  hint: string;
  title: string;
  titleMax: number;
  text: string;
  textMax: number;
  facts: [string, string][];
};

function CopyButton({ value, label = "Copier" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* copie refusée par le navigateur : l'agent peut sélectionner le texte */
        }
      }}
      aria-label={`${label} : ${value.slice(0, 40)}`}
      className="flex h-9 flex-none items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas"
    >
      {done ? <Check aria-hidden className="size-4 text-success-700" /> : <Copy aria-hidden className="size-4" />}
      {done ? "Copié" : label}
    </button>
  );
}

export function DiffusionWorkspace({
  propertyId,
  portals,
  listings,
  photoCount,
}: {
  propertyId: string;
  portals: PortalContent[];
  listings: Listing[];
  photoCount: number;
}) {
  const router = useRouter();
  const [active, setActive] = useState(portals[0].id);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const portal = portals.find((p) => p.id === active)!;
  const listing = listings.find((l) => l.portal === active);
  const isPublished = listing?.status === "publie";
  const [url, setUrl] = useState(listing?.url ?? "");

  function pick(id: string) {
    setActive(id);
    setError(null);
    setUrl(listings.find((l) => l.portal === id)?.url ?? "");
  }

  function mark(published: boolean) {
    setError(null);
    start(async () => {
      const res = await setListingStatus(propertyId, active, published, url);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Portails" className="flex flex-wrap gap-2">
        {portals.map((p) => {
          const l = listings.find((x) => x.portal === p.id);
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={active === p.id}
              onClick={() => pick(p.id)}
              className={clsx(
                "flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold",
                active === p.id ? "border-brand-600 bg-brand-50 text-brand-800" : "border-line-strong bg-white text-body hover:bg-canvas",
              )}
            >
              {p.name}
              {l?.status === "publie" && <CheckCircle2 aria-label="publié" className="size-4 text-success-700" />}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-xl border border-line bg-white shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="text-[17px] font-semibold">Titre</h2>
              <span className={clsx("text-[13px]", portal.title.length > portal.titleMax ? "text-danger-700" : "text-subtle")}>
                {portal.title.length} / {portal.titleMax} caractères
              </span>
            </div>
            <div className="flex items-start gap-3 p-5">
              <p className="min-w-0 flex-1 text-[15px] font-semibold">{portal.title}</p>
              <CopyButton value={portal.title} />
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="text-[17px] font-semibold">Texte de l&apos;annonce</h2>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-subtle">{portal.text.length} / {portal.textMax}</span>
                {portal.text && <CopyButton value={portal.text} />}
              </div>
            </div>
            {portal.text ? (
              <p className="p-5 text-[15px] leading-relaxed whitespace-pre-line text-body">{portal.text}</p>
            ) : (
              <p className="p-5 text-sm text-muted">
                Pas encore de texte.{" "}
                <Link href={`/app/studio/${propertyId}`} className="font-semibold text-brand-700">Générez une annonce dans le Studio IA</Link>{" "}
                ou renseignez le texte de la page publique sur la fiche du bien.
              </p>
            )}
            {portal.text.includes("[À COMPLÉTER]") && (
              <p className="mx-5 mb-5 rounded-lg bg-warning-50 px-4 py-2.5 text-sm text-warning-700">
                Pensez à remplacer « [À COMPLÉTER] » par vos honoraires après avoir collé le texte.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-line bg-white shadow-card">
            <h2 className="border-b border-line px-5 py-4 text-[17px] font-semibold">Informations à reporter</h2>
            <dl>
              {portal.facts.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 border-b border-hover px-5 py-2.5 last:border-0">
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums">{v}</span>
                    <CopyButton value={v} label="Copier" />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5 shadow-card">
            <h2 className="text-[17px] font-semibold">Publier sur {portal.name}</h2>
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-body">
              <li>Téléchargez les photos.</li>
              <li>Ouvrez {portal.name} et créez l&apos;annonce.</li>
              <li>Copiez-collez le titre, le texte et les informations.</li>
              <li>Revenez ici et indiquez que l&apos;annonce est publiée.</li>
            </ol>
            {photoCount > 0 ? (
              <a href={`/app/biens/${propertyId}/photos.zip`} className="flex h-10 items-center justify-center gap-2 rounded-lg border border-line-strong text-sm font-semibold text-body shadow-xs hover:bg-canvas">
                <Download aria-hidden className="size-4" />Télécharger les {photoCount} photo{photoCount > 1 ? "s" : ""} (ZIP)
              </a>
            ) : (
              <p className="text-sm text-muted">Aucune photo : ajoutez-en sur la fiche du bien.</p>
            )}
            <a href={portal.url} target="_blank" rel="noopener noreferrer" className="flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-xs hover:bg-brand-700">
              <ExternalLink aria-hidden className="size-4" />Ouvrir {portal.name}
            </a>
            <p className="text-xs leading-relaxed text-subtle">{portal.hint}</p>
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5 shadow-card">
            <h2 className="text-[17px] font-semibold">Suivi</h2>
            <p className={clsx("text-sm font-semibold", isPublished ? "text-success-700" : "text-muted")}>
              {isPublished
                ? `Publiée le ${new Date(listing.publishedAt).toLocaleDateString("fr-FR")}`
                : listing?.status === "retire"
                  ? `Retirée le ${new Date(listing.removedAt ?? listing.publishedAt).toLocaleDateString("fr-FR")}`
                  : "Pas encore publiée"}
            </p>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
              Lien de l&apos;annonce (facultatif)
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="h-10 rounded-lg border border-line-strong px-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </label>
            {error && <p role="alert" className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={pending} onClick={() => mark(true)} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60">
                {pending && <Loader2 aria-hidden className="size-4 animate-spin" />}
                {isPublished ? "Mettre à jour" : "Marquer comme publiée"}
              </button>
              {isPublished && (
                <button type="button" disabled={pending} onClick={() => mark(false)} className="h-10 rounded-lg border border-line-strong px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas disabled:opacity-60">
                  Annonce retirée
                </button>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
