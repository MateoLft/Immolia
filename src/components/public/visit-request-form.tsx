"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { sendVisitRequest, type VisitRequestState } from "@/app/(public)/b/[slug]/actions";

const input =
  "h-11 w-full rounded-lg border border-line-strong bg-white px-3.5 text-[15px] text-ink outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100";

export function VisitRequestForm({ slug, agencyName }: { slug: string; agencyName: string }) {
  const [state, action, pending] = useActionState<VisitRequestState, FormData>(sendVisitRequest.bind(null, slug), {});
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div role="status" className="flex flex-col items-center gap-2 py-6 text-center">
        <CheckCircle2 aria-hidden className="size-9 text-success-700" />
        <p className="text-lg font-semibold">Demande envoyée</p>
        <p className="text-sm text-muted">{agencyName} vous recontacte rapidement pour organiser la visite.</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>Site web<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
        Nom et prénom *
        <input name="name" required autoComplete="name" defaultValue={v.name} className={input} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
        Email
        <input name="email" type="email" autoComplete="email" defaultValue={v.email} className={input} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
        Téléphone
        <input name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} className={input} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
        Vos disponibilités
        <input name="availability" placeholder="Ex. : samedi matin, soirs en semaine" defaultValue={v.availability} className={input} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-body">
        Message
        <textarea name="message" rows={3} defaultValue={v.message} className={`${input} h-auto py-2.5`} />
      </label>
      <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted">
        <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-brand-600" />
        <span>J&apos;accepte que mes coordonnées soient transmises à {agencyName} pour traiter ma demande de visite.</span>
      </label>
      {state.error && <p role="alert" className="rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="h-12 rounded-lg bg-brand-600 text-base font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60">
        {pending ? "Envoi…" : "Demander une visite"}
      </button>
    </form>
  );
}
