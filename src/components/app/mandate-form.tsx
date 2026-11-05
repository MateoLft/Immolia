"use client";

import { useActionState, useState, type ReactNode } from "react";
import clsx from "clsx";
import { createMandate, type MandateFormState } from "@/app/app/mandats/actions";
import { ButtonLink } from "@/components/ui/button";
import { MANDATE_TYPES, type Seller } from "@/lib/property-types";

const input =
  "h-11 w-full rounded-lg border border-line-strong bg-white px-3.5 text-[15px] text-ink shadow-xs outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100";

function Field({ label, name, hint, className, children }: { label: string; name: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={name} className="text-sm font-medium text-body">{label}</label>
      {children}
      {hint && <p className="text-[13px] text-subtle">{hint}</p>}
    </div>
  );
}

function plusMonths(date: string, months: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function MandateForm({
  properties,
  sellers,
  defaults,
}: {
  properties: { id: string; title: string; city: string; sellerId: string | null; price: number | null }[];
  sellers: Seller[];
  defaults: { today: string; sellerId?: string; propertyId?: string; feeText: string };
}) {
  const [state, action, pending] = useActionState<MandateFormState, FormData>(createMandate, {});
  const v = state.values ?? {};
  const [signedOn, setSignedOn] = useState(v.signed_on ?? defaults.today);
  const [endsOn, setEndsOn] = useState(v.ends_on ?? plusMonths(defaults.today, 3));
  const [sellerMode, setSellerMode] = useState<"existing" | "new">(sellers.length > 0 ? "existing" : "new");
  const preProperty = properties.find((p) => p.id === (v.property_id ?? defaults.propertyId));

  return (
    <form action={action} className="flex flex-col gap-6">
      <fieldset className="rounded-xl border border-line bg-white shadow-card">
        <legend className="sr-only">Mandat</legend>
        <h2 aria-hidden className="border-b border-line px-5 py-4 text-[17px] font-semibold">Mandat</h2>
        <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Type *" name="type">
            <select id="type" name="type" defaultValue={v.type ?? "exclusif"} className={input}>
              {MANDATE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Date de signature *" name="signed_on">
            <input id="signed_on" name="signed_on" type="date" value={signedOn} onChange={(e) => setSignedOn(e.target.value)} className={input} />
          </Field>
          <Field label="Date de fin" name="ends_on" hint="Un mandat exclusif dure souvent 3 mois">
            <input id="ends_on" name="ends_on" type="date" value={endsOn} min={signedOn} onChange={(e) => setEndsOn(e.target.value)} className={input} />
          </Field>
          <Field label="Prix de vente (€)" name="price">
            <input id="price" name="price" inputMode="numeric" defaultValue={v.price ?? (preProperty?.price ? String(preProperty.price) : "")} className={input} />
          </Field>
          <Field label="Honoraires" name="fee_text" className="sm:col-span-2 lg:col-span-4">
            <input id="fee_text" name="fee_text" defaultValue={v.fee_text ?? defaults.feeText} placeholder="Ex. : 5 % TTC à la charge du vendeur" className={input} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-line bg-white shadow-card">
        <legend className="sr-only">Mandant et bien</legend>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 aria-hidden className="text-[17px] font-semibold">Mandant et bien</h2>
          {sellers.length > 0 && (
            <div role="group" aria-label="Mandant" className="flex gap-1 rounded-lg border border-line bg-hover p-1">
              {(["existing", "new"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={sellerMode === m} onClick={() => setSellerMode(m)} className={clsx("h-8 rounded-md px-3 text-sm font-semibold", sellerMode === m ? "bg-white text-ink shadow-xs" : "text-muted")}>
                  {m === "existing" ? "Vendeur enregistré" : "Nouveau vendeur"}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          {sellerMode === "existing" ? (
            <Field label="Mandant (vendeur) *" name="seller_id">
              <select id="seller_id" name="seller_id" defaultValue={v.seller_id ?? defaults.sellerId ?? preProperty?.sellerId ?? ""} className={input}>
                <option value="" disabled>Choisir un vendeur</option>
                {sellers.map((s) => <option key={s.id} value={s.id}>{s.fullName}{s.isProspect ? " (prospect)" : ""}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Nom du mandant *" name="seller_name">
              <input id="seller_name" name="seller_name" defaultValue={v.seller_name} className={input} />
            </Field>
          )}
          <Field label="Bien" name="property_id">
            <select id="property_id" name="property_id" defaultValue={v.property_id ?? defaults.propertyId ?? ""} className={input}>
              <option value="">Bien pas encore créé dans Immolia</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.title} · {p.city}</option>)}
            </select>
          </Field>
          <Field label="Désignation du bien (si non créé)" name="property_label" className="sm:col-span-2" hint="Ex. : Appartement T3, 12 rue des Lilas, 69006 Lyon">
            <input id="property_label" name="property_label" defaultValue={v.property_label} className={input} />
          </Field>
          <Field label="Notes" name="notes" className="sm:col-span-2">
            <textarea id="notes" name="notes" rows={2} defaultValue={v.notes} className={clsx(input, "h-auto py-2.5")} />
          </Field>
        </div>
      </fieldset>

      <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
        Le mandat reçoit automatiquement le numéro suivant du registre. Conformément à la loi Hoguet, une inscription ne peut pas être supprimée ni renumérotée : vous pourrez seulement changer son statut.
      </p>
      {state.error && <p role="alert" className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{state.error}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <ButtonLink href="/app/mandats" variant="secondary" size="lg">Annuler</ButtonLink>
        <button type="submit" disabled={pending} className="h-12 rounded-lg bg-brand-600 px-5 text-base font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60">
          {pending ? "Inscription…" : "Inscrire au registre"}
        </button>
      </div>
    </form>
  );
}
