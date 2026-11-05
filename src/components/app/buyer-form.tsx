"use client";

import { useActionState, type ReactNode } from "react";
import clsx from "clsx";
import { createBuyer, updateBuyer, type BuyerFormState } from "@/app/app/acquereurs/actions";
import { ButtonLink } from "@/components/ui/button";
import { FINANCING_OPTIONS, PROPERTY_KINDS } from "@/lib/property-types";
import type { BuyerFull } from "@/lib/buyers";

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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-line bg-white shadow-card">
      <legend className="sr-only">{title}</legend>
      <h2 aria-hidden className="border-b border-line px-5 py-4 text-[17px] font-semibold">{title}</h2>
      <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </fieldset>
  );
}

function initial(b?: BuyerFull): Record<string, string> {
  if (!b) return { status: "actif", financing: "non-etudie" };
  const financing = FINANCING_OPTIONS.find((f) => f.label === b.financing)?.value ?? "";
  return {
    full_name: b.fullName,
    email: b.email ?? "",
    phone: b.phone ?? "",
    budget: b.budgetMax ? String(b.budgetMax) : "",
    min_surface: b.minSurface ? String(b.minSurface) : "",
    min_rooms: b.minRooms ? String(b.minRooms) : "",
    cities: b.cities.join(", "),
    kinds: b.kinds.join(","),
    notes: b.notes ?? "",
    status: b.status,
    financing,
  };
}

export function BuyerForm({ buyer }: { buyer?: BuyerFull }) {
  const formAction = buyer ? updateBuyer.bind(null, buyer.id) : createBuyer;
  const [state, action, pending] = useActionState<BuyerFormState, FormData>(formAction, {});
  const v = state.values ?? initial(buyer);
  const kinds = (v.kinds ?? "").split(",").filter(Boolean);

  return (
    <form action={action} className="flex flex-col gap-6">
      <Section title="Coordonnées">
        <Field label="Nom et prénom *" name="full_name" className="sm:col-span-2">
          <input id="full_name" name="full_name" defaultValue={v.full_name} className={input} />
        </Field>
        <Field label="Téléphone" name="phone">
          <input id="phone" name="phone" type="tel" defaultValue={v.phone} className={input} />
        </Field>
        <Field label="Email" name="email">
          <input id="email" name="email" type="email" defaultValue={v.email} className={input} />
        </Field>
        <Field label="Financement" name="financing" className="sm:col-span-2">
          <select id="financing" name="financing" defaultValue={v.financing} className={input}>
            {buyer && <option value="">Inchangé ({buyer.financing ?? "non renseigné"})</option>}
            {FINANCING_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>
        <Field label="Statut" name="status" className="sm:col-span-2">
          <select id="status" name="status" defaultValue={v.status} className={input}>
            <option value="actif">En recherche</option>
            <option value="achete">A acheté</option>
            <option value="abandonne">Recherche abandonnée</option>
          </select>
        </Field>
      </Section>

      <Section title="Critères de recherche">
        <Field label="Budget maximum (€)" name="budget">
          <input id="budget" name="budget" inputMode="numeric" defaultValue={v.budget} className={input} />
        </Field>
        <Field label="Surface minimum (m²)" name="min_surface">
          <input id="min_surface" name="min_surface" inputMode="decimal" defaultValue={v.min_surface} className={input} />
        </Field>
        <Field label="Pièces minimum" name="min_rooms">
          <input id="min_rooms" name="min_rooms" inputMode="numeric" defaultValue={v.min_rooms} className={input} />
        </Field>
        <Field label="Villes ou codes postaux" name="cities" hint="Séparés par des virgules" className="sm:col-span-2 lg:col-span-1">
          <input id="cities" name="cities" placeholder="Lyon 6, Villeurbanne, 69003" defaultValue={v.cities} className={input} />
        </Field>
        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4">
          <span className="text-sm font-medium text-body">Types de bien (aucun = tous)</span>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_KINDS.map((k) => (
              <label key={k.value} className="flex h-10 items-center gap-2 rounded-lg border border-line-strong px-3 text-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
                <input type="checkbox" name="kinds" value={k.value} defaultChecked={kinds.includes(k.value)} className="size-4 accent-brand-600" />
                {k.label}
              </label>
            ))}
          </div>
        </div>
        <Field label="Notes" name="notes" className="sm:col-span-2 lg:col-span-4">
          <textarea id="notes" name="notes" rows={3} defaultValue={v.notes} className={clsx(input, "h-auto py-2.5")} />
        </Field>
      </Section>

      {state.error && <p role="alert" className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{state.error}</p>}

      <div className="flex flex-wrap justify-end gap-3">
        <ButtonLink href={buyer ? `/app/acquereurs/${buyer.id}` : "/app/acquereurs"} variant="secondary" size="lg">Annuler</ButtonLink>
        <button type="submit" disabled={pending} className="h-12 rounded-lg bg-brand-600 px-5 text-base font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
