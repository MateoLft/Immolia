"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { draftComment, saveEstimation } from "@/app/app/estimations/actions";
import type { EstimationRequest } from "@/lib/property-types";

const input = "h-11 w-full rounded-lg border border-line-strong bg-white px-3.5 text-[15px] outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100";

export function EstimationEditor({ request, suggestion, aiReady }: { request: EstimationRequest; suggestion: { low: number; high: number } | null; aiReady: boolean }) {
  const router = useRouter();
  const [low, setLow] = useState(request.priceLow ? String(request.priceLow) : suggestion ? String(suggestion.low) : "");
  const [high, setHigh] = useState(request.priceHigh ? String(request.priceHigh) : suggestion ? String(suggestion.high) : "");
  const [comment, setComment] = useState(request.comment ?? "");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState(request.status === "nouvelle" ? "en-cours" : request.status);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [drafting, startDraft] = useTransition();

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line bg-white p-5 shadow-card">
      <h2 className="text-[17px] font-semibold">Avis de valeur</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-body">Prix bas (€)<input value={low} onChange={(e) => setLow(e.target.value)} inputMode="numeric" className={input} /></label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-body">Prix haut (€)<input value={high} onChange={(e) => setHigh(e.target.value)} inputMode="numeric" className={input} /></label>
      </div>
      {suggestion && !request.priceLow && <p className="text-[13px] text-subtle">Fourchette pré-remplie à partir du prix médian au m² de vos biens comparables (±7 %). Ajustez-la selon votre visite.</p>}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
        Vos remarques pour l&apos;IA (état, atouts, défauts constatés…)
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${input} h-auto py-2.5`} />
      </label>
      {aiReady && (
        <button
          type="button"
          disabled={drafting}
          onClick={() => startDraft(async () => {
            setMsg(null);
            const r = await draftComment(request.id, low, high, notes);
            if (r.ok) setComment(r.text);
            else setMsg({ type: "err", text: r.error });
          })}
          className="flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-line-strong px-4 text-sm font-semibold text-body shadow-xs hover:bg-canvas disabled:opacity-60"
        >
          {drafting ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Sparkles aria-hidden className="size-4" />}
          {drafting ? "Rédaction…" : "Rédiger le commentaire avec l'IA"}
        </button>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
        Commentaire (figure sur l&apos;avis de valeur)
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={8} className={`${input} h-auto py-2.5 leading-relaxed`} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-body sm:max-w-xs">
        Statut
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={input}>
          <option value="en-cours">En cours</option>
          <option value="envoyee">Avis envoyé</option>
          <option value="archivee">Archivée</option>
        </select>
      </label>
      {msg && <p role={msg.type === "err" ? "alert" : "status"} className={msg.type === "err" ? "rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-700" : "rounded-lg bg-success-50 px-3 py-2 text-sm text-success-700"}>{msg.text}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => {
            const r = await saveEstimation(request.id, { priceLow: low, priceHigh: high, comment, status });
            setMsg(r.ok ? { type: "ok", text: "Avis enregistré." } : { type: "err", text: r.error });
            router.refresh();
          })}
          className="h-10 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <a href={`/app/estimations/${request.id}/avis.pdf`} target="_blank" rel="noopener" className="flex h-10 items-center rounded-lg border border-line-strong px-4 text-sm font-semibold text-body shadow-xs hover:bg-canvas">
          Télécharger l&apos;avis de valeur (PDF)
        </a>
      </div>
      <p className="text-xs text-subtle">Enregistrez avant de télécharger le PDF. Joignez-le ensuite à votre email au propriétaire.</p>
    </section>
  );
}
