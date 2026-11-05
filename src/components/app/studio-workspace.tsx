"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { Check, Copy, Globe, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { generateContent } from "@/app/app/studio/actions";
import { savePublicDescription } from "@/app/app/biens/publication-actions";
import { CONTENT_KINDS, TONES, type ContentKind, type GeneratedContent, type Tone } from "@/lib/studio";

const dateFr = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

export function StudioWorkspace({
  propertyId,
  initialHistory,
  aiReady,
  photoCount,
  maxPhotos,
}: {
  propertyId: string;
  initialHistory: GeneratedContent[];
  aiReady: boolean;
  photoCount: number;
  maxPhotos: number;
}) {
  const [usePhotos, setUsePhotos] = useState(photoCount > 0);
  const [kind, setKind] = useState<ContentKind>("annonce");
  const [tone, setTone] = useState<Tone>("chaleureux");
  const [history, setHistory] = useState(initialHistory);
  const [current, setCurrent] = useState<GeneratedContent | null>(initialHistory.find((h) => h.kind === "annonce") ?? null);
  const [text, setText] = useState(current?.content ?? "");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [publishedText, setPublishedText] = useState(false);
  const [pending, startTransition] = useTransition();

  function show(item: GeneratedContent | null) {
    setCurrent(item);
    setText(item?.content ?? "");
    setCopied(false);
  }

  function pickKind(k: ContentKind) {
    setKind(k);
    setError(null);
    show(history.find((h) => h.kind === k) ?? null);
  }

  function generate() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await generateContent(propertyId, kind, tone, usePhotos);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setHistory((h) => [res.content, ...h]);
      show(res.content);
      const notices: string[] = [];
      if (res.photosRequested > 0 && res.usedPhotos === 0) notices.push("Les photos n'ont pas pu être analysées : le texte a été rédigé à partir de la fiche seule.");
      if (!res.saved) notices.push("Contenu généré, mais non enregistré dans l'historique.");
      if (notices.length > 0) setNotice(notices.join(" "));
    });
  }

  function applyToPublicPage() {
    setError(null);
    startTransition(async () => {
      const res = await savePublicDescription(propertyId, text);
      if (!res.ok) setError(res.error);
      else {
        setPublishedText(true);
        setTimeout(() => setPublishedText(false), 3000);
      }
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copie impossible : sélectionnez le texte et copiez-le manuellement.");
    }
  }

  const kindHistory = history.filter((h) => h.kind === kind);
  const kindInfo = CONTENT_KINDS.find((k) => k.value === kind)!;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-6 rounded-xl border border-line bg-white p-5 shadow-card">
        <div className="flex flex-col gap-2.5">
          <h2 className="text-sm font-semibold">Que voulez-vous créer ?</h2>
          <div role="group" aria-label="Type de contenu" className="flex flex-col gap-1">
            {CONTENT_KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                aria-pressed={kind === k.value}
                onClick={() => pickKind(k.value)}
                className={clsx(
                  "flex min-h-11 flex-col items-start rounded-lg px-3 py-2 text-left",
                  kind === k.value ? "bg-brand-50 text-brand-800" : "text-body hover:bg-canvas",
                )}
              >
                <span className="text-sm font-semibold">{k.label}</span>
                <span className={clsx("text-xs", kind === k.value ? "text-brand-700" : "text-subtle")}>{k.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <h2 className="text-sm font-semibold">Ton</h2>
          <div role="group" aria-label="Ton" className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-pressed={tone === t.value}
                onClick={() => setTone(t.value)}
                className={clsx(
                  "h-9 rounded-lg border px-3 text-sm font-semibold",
                  tone === t.value ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-white text-body hover:bg-canvas",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={clsx("flex items-start gap-2.5 text-sm", photoCount === 0 ? "text-subtle" : "text-body")}>
            <input
              type="checkbox"
              checked={usePhotos}
              disabled={photoCount === 0}
              onChange={(e) => setUsePhotos(e.target.checked)}
              className="mt-0.5 size-4 accent-brand-600"
            />
            <span>
              <span className="font-semibold">Analyser les photos</span>
              <span className="block text-xs text-subtle">
                {photoCount === 0
                  ? "Ajoutez des photos sur la fiche du bien pour enrichir le texte."
                  : `L'IA regarde ${Math.min(photoCount, maxPhotos)} photo${Math.min(photoCount, maxPhotos) > 1 ? "s" : ""} (ambiance, style, état).`}
              </span>
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={pending || !aiReady}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 text-[15px] font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Sparkles aria-hidden className="size-4" />}
          {pending ? "Rédaction en cours…" : current ? "Générer une nouvelle version" : "Générer"}
        </button>
        {!aiReady && (
          <p className="rounded-lg bg-warning-50 px-3 py-2.5 text-[13px] text-warning-700">
            Le Studio IA n&apos;est pas encore activé (clé ANTHROPIC_API_KEY manquante).
          </p>
        )}
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <p className="text-sm font-semibold">Autres formats</p>
          <a href={`/app/biens/${propertyId}/plaquette.pdf`} target="_blank" rel="noopener" className="flex h-10 items-center justify-center rounded-lg border border-line-strong text-sm font-semibold text-body shadow-xs hover:bg-canvas">Plaquette PDF</a>
          <a href={`/app/studio/${propertyId}/video`} className="flex h-10 items-center justify-center rounded-lg border border-line-strong text-sm font-semibold text-body shadow-xs hover:bg-canvas">Vidéo courte (Reels, TikTok)</a>
        </div>
        <p className="text-xs leading-relaxed text-subtle">
          L&apos;IA n&apos;utilise que les informations de la fiche du bien. Plus la fiche est complète, meilleur est le texte. Relisez toujours avant de publier.
        </p>
      </aside>

      <section className="flex min-w-0 flex-col rounded-xl border border-line bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-[17px] font-semibold">{kindInfo.label}</h2>
            {current && <p className="mt-0.5 text-[13px] text-muted">Version du {dateFr.format(new Date(current.createdAt))} · ton {TONES.find((t) => t.value === current.tone)?.label.toLowerCase()}</p>}
          </div>
          {current && (
            <div className="flex flex-wrap gap-2">
              {kind === "annonce" && (
                <button type="button" onClick={applyToPublicPage} disabled={pending} className="flex h-9 items-center gap-2 rounded-lg border border-line-strong px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas disabled:opacity-60">
                  {publishedText ? <Check aria-hidden className="size-4 text-success-700" /> : <Globe aria-hidden className="size-4" />}
                  {publishedText ? "Texte enregistré" : "Utiliser sur la page publique"}
                </button>
              )}
              <button type="button" onClick={copy} className="flex h-9 items-center gap-2 rounded-lg border border-line-strong px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas">
                {copied ? <Check aria-hidden className="size-4 text-success-700" /> : <Copy aria-hidden className="size-4" />}
                {copied ? "Copié" : "Copier"}
              </button>
              <button type="button" onClick={generate} disabled={pending || !aiReady} className="flex h-9 items-center gap-2 rounded-lg border border-line-strong px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas disabled:opacity-60">
                <RefreshCw aria-hidden className="size-4" />Régénérer
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 p-5" aria-live="polite">
          {error && <p role="alert" className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</p>}
          {notice && <p className="rounded-lg bg-warning-50 px-4 py-3 text-sm text-warning-700">{notice}</p>}
          {pending && !current ? (
            <div className="flex flex-col gap-3 py-2">
              {[90, 100, 95, 70].map((w) => <span key={w} className="block h-4 animate-pulse rounded bg-hover" style={{ width: `${w}%` }} />)}
            </div>
          ) : current ? (
            <>
              <label htmlFor="studio-text" className="sr-only">Texte généré (modifiable)</label>
              <textarea
                id="studio-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={16}
                className={clsx(
                  "w-full resize-y rounded-lg border border-line-strong p-4 text-[15px] leading-relaxed text-ink outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100",
                  pending && "opacity-50",
                )}
              />
              <p className="text-xs text-subtle">Vous pouvez retoucher le texte avant de le copier. Les modifications ne sont pas enregistrées.</p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <Sparkles aria-hidden className="size-7 text-brand-600" strokeWidth={1.6} />
              <p className="font-semibold">Aucun contenu pour l&apos;instant</p>
              <p className="max-w-sm text-sm text-muted">Choisissez un ton puis cliquez sur « Générer ». La rédaction prend quelques secondes.</p>
            </div>
          )}
        </div>

        {kindHistory.length > 1 && (
          <div className="border-t border-line px-5 py-4">
            <h3 className="text-sm font-semibold">Versions précédentes</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {kindHistory.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => show(h)}
                    aria-pressed={current?.id === h.id}
                    className={clsx(
                      "h-9 rounded-lg border px-3 text-[13px] font-medium",
                      current?.id === h.id ? "border-brand-600 bg-brand-50 text-brand-800" : "border-line text-body hover:bg-canvas",
                    )}
                  >
                    {dateFr.format(new Date(h.createdAt))} · {TONES.find((t) => t.value === h.tone)?.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
