"use client";

import { useActionState, useState, type ReactNode } from "react";
import clsx from "clsx";
import { createVisit, type VisitFormState } from "@/app/app/visites/actions";
import { ButtonLink } from "@/components/ui/button";
import { FINANCING_OPTIONS, type Buyer } from "@/lib/property-types";

const input =
  "h-11 w-full rounded-lg border border-line-strong bg-white px-3.5 text-[15px] text-ink shadow-xs outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100";

function Field({ label, htmlFor, children, className }: { label: string; htmlFor: string; children: ReactNode; className?: string }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-body">{label}</label>
      {children}
    </div>
  );
}

export type VisitFormDefaults = {
  propertyId?: string;
  requestId?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  notes?: string;
  date: string;
};

export function VisitForm({
  properties,
  buyers,
  defaults,
}: {
  properties: { id: string; title: string; city: string }[];
  buyers: Buyer[];
  defaults: VisitFormDefaults;
}) {
  const [state, action, pending] = useActionState<VisitFormState, FormData>(createVisit, {});
  const v = state.values ?? {};
  const fromRequest = Boolean(defaults.requestId);
  const [mode, setMode] = useState<"new" | "existing">((v.buyer_mode as "new" | "existing") ?? "new");

  return (
    <form action={action} className="flex flex-col gap-6">
      {defaults.requestId && <input type="hidden" name="request_id" value={defaults.requestId} />}
      <input type="hidden" name="buyer_mode" value={mode} />

      <fieldset className="rounded-xl border border-line bg-white shadow-card">
        <legend className="sr-only">Visite</legend>
        <h2 aria-hidden className="border-b border-line px-5 py-4 text-[17px] font-semibold">Visite</h2>
        <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Bien *" htmlFor="property_id" className="sm:col-span-2">
            <select id="property_id" name="property_id" required defaultValue={v.property_id ?? defaults.propertyId ?? ""} className={input}>
              <option value="" disabled>Choisir un bien</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.title} · {p.city}</option>)}
            </select>
          </Field>
          <Field label="Date *" htmlFor="date">
            <input id="date" name="date" type="date" required min={defaults.date} defaultValue={v.date ?? defaults.date} className={input} />
          </Field>
          <Field label="Heure *" htmlFor="time">
            <input id="time" name="time" type="time" required step={900} defaultValue={v.time ?? "10:00"} className={input} />
          </Field>
          <Field label="Notes (internes)" htmlFor="notes" className="sm:col-span-2 lg:col-span-4">
            <textarea id="notes" name="notes" rows={3} defaultValue={v.notes ?? defaults.notes} className={clsx(input, "h-auto py-2.5")} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-line bg-white shadow-card">
        <legend className="sr-only">Acquéreur</legend>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 aria-hidden className="text-[17px] font-semibold">Acquéreur</h2>
          {!fromRequest && buyers.length > 0 && (
            <div role="group" aria-label="Type d'acquéreur" className="flex gap-1 rounded-lg border border-line bg-hover p-1">
              {(["new", "existing"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                  className={clsx("h-8 rounded-md px-3 text-sm font-semibold", mode === m ? "bg-white text-ink shadow-xs" : "text-muted")}
                >
                  {m === "new" ? "Nouvel acquéreur" : "Acquéreur existant"}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {mode === "existing" ? (
            <Field label="Acquéreur *" htmlFor="buyer_id" className="sm:col-span-2">
              <select id="buyer_id" name="buyer_id" defaultValue={v.buyer_id ?? ""} className={input}>
                <option value="" disabled>Choisir un acquéreur</option>
                {buyers.map((b) => <option key={b.id} value={b.id}>{b.fullName}{b.phone ? ` · ${b.phone}` : b.email ? ` · ${b.email}` : ""}</option>)}
              </select>
            </Field>
          ) : (
            <>
              <Field label="Nom et prénom *" htmlFor="buyer_name" className="sm:col-span-2">
                <input id="buyer_name" name="buyer_name" autoComplete="off" defaultValue={v.buyer_name ?? defaults.buyerName} className={input} />
              </Field>
              <Field label="Téléphone" htmlFor="buyer_phone">
                <input id="buyer_phone" name="buyer_phone" type="tel" defaultValue={v.buyer_phone ?? defaults.buyerPhone} className={input} />
              </Field>
              <Field label="Email" htmlFor="buyer_email">
                <input id="buyer_email" name="buyer_email" type="email" defaultValue={v.buyer_email ?? defaults.buyerEmail} className={input} />
              </Field>
              <Field label="Financement" htmlFor="financing" className="sm:col-span-2">
                <select id="financing" name="financing" defaultValue={v.financing ?? "non-etudie"} className={input}>
                  {FINANCING_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </Field>
            </>
          )}
        </div>
      </fieldset>

      {state.error && <p role="alert" className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{state.error}</p>}

      <div className="flex flex-wrap justify-end gap-3">
        <ButtonLink href="/app/visites" variant="secondary" size="lg">Annuler</ButtonLink>
        <button type="submit" disabled={pending} className="h-12 rounded-lg bg-brand-600 px-5 text-base font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60">
          {pending ? "Enregistrement…" : "Planifier la visite"}
        </button>
      </div>
    </form>
  );
}
