"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { archiveVisitRequest, setVisitStatus, setVoucherSigned } from "@/app/app/visites/actions";

const btn = "flex h-9 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-sm font-semibold text-body shadow-xs hover:bg-canvas disabled:opacity-60";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Action impossible.");
      router.refresh();
    });
  return { pending, error, run };
}

export function UpcomingVisitActions({ id, voucherSigned }: { id: string; voucherSigned: boolean }) {
  const { pending, error, run } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex h-9 items-center gap-2 text-sm text-body">
        <input
          type="checkbox"
          checked={voucherSigned}
          disabled={pending}
          onChange={(e) => run(() => setVoucherSigned(id, e.target.checked))}
          className="size-4 accent-brand-600"
        />
        Bon de visite signé
      </label>
      <button
        type="button"
        className={btn}
        disabled={pending}
        onClick={() => {
          if (confirm("Annuler cette visite ?")) run(() => setVisitStatus(id, "annulee"));
        }}
      >
        {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <X aria-hidden className="size-4" />}Annuler
      </button>
      {error && <p role="alert" className="w-full text-sm text-danger-700">{error}</p>}
    </div>
  );
}

export function CompleteVisitForm({ id }: { id: string }) {
  const { pending, error, run } = useAction();
  const [feedback, setFeedback] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`fb-${id}`} className="text-sm font-medium text-body">Compte rendu de la visite</label>
      <textarea
        id={`fb-${id}`}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={2}
        placeholder="Ressenti de l'acquéreur, points positifs, objections…"
        className="w-full rounded-lg border border-line-strong p-3 text-sm outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => run(() => setVisitStatus(id, "realisee", feedback))} className="flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60">
          {pending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Check aria-hidden className="size-4" />}Visite réalisée
        </button>
        <button type="button" disabled={pending} onClick={() => run(() => setVisitStatus(id, "annulee"))} className={btn}>
          N&apos;a pas eu lieu
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-danger-700">{error}</p>}
    </div>
  );
}

export function ArchiveRequestButton({ id }: { id: string }) {
  const { pending, error, run } = useAction();
  return (
    <>
      <button type="button" disabled={pending} onClick={() => run(() => archiveVisitRequest(id))} className={btn}>
        Archiver
      </button>
      {error && <p role="alert" className="w-full text-sm text-danger-700">{error}</p>}
    </>
  );
}
