"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { sendEstimationRequest, type EstimationFormState } from "@/app/(public)/estimation/[slug]/actions";
import { PROPERTY_KINDS } from "@/lib/property-types";

const input =
  "h-11 w-full rounded-lg border border-line-strong bg-white px-3.5 text-[15px] text-ink outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100";

export function EstimationForm({ slug, agencyName }: { slug: string; agencyName: string }) {
  const [state, action, pending] = useActionState<EstimationFormState, FormData>(sendEstimationRequest.bind(null, slug), {});
  const v = state.values ?? {};
  if (state.ok) {
    return (
      <div role="status" className="flex flex-col items-center gap-2 py-10 text-center">
        <CheckCircle2 aria-hidden className="size-10 text-success-700" />
        <p className="text-lg font-semibold">Demande envoyée</p>
        <p className="max-w-sm text-sm text-muted">{agencyName} étudie votre bien et vous recontacte rapidement avec une estimation.</p>
      </div>
    );
  }
  const L = "flex flex-col gap-1.5 text-sm font-medium text-body";
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden"><label>Site web<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className={L}>Type de bien
        <select name="kind" defaultValue={v.kind ?? "appartement"} className={input}>
          {PROPERTY_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
      </label>
      <label className={L}>Ville *<input name="city" required defaultValue={v.city} autoComplete="address-level2" className={input} /></label>
      <label className={`${L} sm:col-span-2`}>Adresse (facultatif)<input name="address" defaultValue={v.address} autoComplete="street-address" className={input} /></label>
      <label className={L}>Surface habitable (m²)<input name="surface" inputMode="decimal" defaultValue={v.surface} className={input} /></label>
      <label className={L}>Nombre de pièces<input name="rooms" inputMode="numeric" defaultValue={v.rooms} className={input} /></label>
      <label className={`${L} sm:col-span-2`}>Précisions (état, travaux, extérieur…)<textarea name="message" rows={3} defaultValue={v.message} className={`${input} h-auto py-2.5`} /></label>
      <label className={`${L} sm:col-span-2`}>Nom et prénom *<input name="name" required defaultValue={v.name} autoComplete="name" className={input} /></label>
      <label className={L}>Email<input name="email" type="email" defaultValue={v.email} autoComplete="email" className={input} /></label>
      <label className={L}>Téléphone<input name="phone" type="tel" defaultValue={v.phone} autoComplete="tel" className={input} /></label>
      <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted sm:col-span-2">
        <input type="checkbox" name="consent" required className="mt-0.5 size-4 accent-brand-600" />
        <span>J&apos;accepte que mes coordonnées soient transmises à {agencyName} pour être recontacté au sujet de l&apos;estimation de mon bien.</span>
      </label>
      {state.error && <p role="alert" className="rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700 sm:col-span-2">{state.error}</p>}
      <button type="submit" disabled={pending} className="h-12 rounded-lg bg-brand-600 text-base font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60 sm:col-span-2">
        {pending ? "Envoi…" : "Recevoir mon estimation gratuite"}
      </button>
    </form>
  );
}
