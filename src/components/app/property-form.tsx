"use client";

import { useActionState, type ReactNode } from "react";
import clsx from "clsx";
import { createProperty, updateProperty, type PropertyFormState } from "@/app/app/biens/actions";
import { ENERGY_CLASSES, MANDATE_TYPES, PROPERTY_KINDS, STATUS_LABEL, PROPERTY_STATUSES, type Property } from "@/lib/property-types";
import { ButtonLink } from "@/components/ui/button";

const inputClasses =
  "h-11 w-full rounded-lg border border-line-strong bg-white px-3.5 text-[15px] text-ink shadow-xs outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 aria-[invalid=true]:border-danger-700";

function Field({
  label,
  name,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={name} className="text-sm font-medium text-body">{label}</label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-[13px] text-danger-700">{error}</p>
      ) : hint ? (
        <p className="text-[13px] text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

function Input({ name, error, ...props }: { name: string; error?: string } & React.ComponentProps<"input">) {
  return (
    <input
      id={name}
      name={name}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${name}-error` : undefined}
      className={inputClasses}
      {...props}
    />
  );
}

function Select({ name, children, defaultValue }: { name: string; children: ReactNode; defaultValue?: string }) {
  return (
    <select id={name} name={name} defaultValue={defaultValue} className={inputClasses}>
      {children}
    </select>
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

/** Valeurs initiales du formulaire à partir d'un bien existant. */
function toValues(p: Property): Record<string, string> {
  const s = (x: string | number | null) => (x === null ? "" : String(x));
  return {
    title: p.title,
    kind: p.kind,
    address: s(p.address),
    postal_code: s(p.postalCode),
    city: p.city,
    price: s(p.price),
    surface: s(p.surface),
    rooms: s(p.rooms),
    bedrooms: s(p.bedrooms),
    floor: s(p.floor),
    dpe: s(p.dpe),
    ges: s(p.ges),
    charges: s(p.annualCharges),
    description: s(p.description),
    mandate_type: s(p.mandateType),
    mandate_end: s(p.mandateEnd),
    reference: s(p.reference),
    status: p.status,
  };
}

export function PropertyForm({ property }: { property?: Property }) {
  const formAction = property ? updateProperty.bind(null, property.id) : createProperty;
  const [state, action, pending] = useActionState<PropertyFormState, FormData>(formAction, {});
  const e = state.fieldErrors ?? {};
  const v = state.values ?? (property ? toValues(property) : {});

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      <Section title="Le bien">
        <Field label="Titre de l'annonce *" name="title" error={e.title} className="sm:col-span-2 lg:col-span-3">
          <Input name="title" defaultValue={v.title} error={e.title} placeholder="Ex. : T3 lumineux avec balcon" required />
        </Field>
        <Field label="Type de bien" name="kind">
          <Select name="kind" defaultValue={v.kind ?? "appartement"}>
            {PROPERTY_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </Select>
        </Field>
        <Field label="Adresse" name="address" className="sm:col-span-2" hint="Non affichée publiquement">
          <Input name="address" defaultValue={v.address} autoComplete="street-address" />
        </Field>
        <Field label="Code postal" name="postal_code">
          <Input name="postal_code" defaultValue={v.postal_code} inputMode="numeric" autoComplete="postal-code" />
        </Field>
        <Field label="Ville *" name="city" error={e.city}>
          <Input name="city" defaultValue={v.city} error={e.city} autoComplete="address-level2" required />
        </Field>
      </Section>

      <Section title="Caractéristiques">
        <Field label="Prix de vente (€)" name="price" error={e.price}>
          <Input name="price" defaultValue={v.price} error={e.price} inputMode="numeric" />
        </Field>
        <Field label="Surface habitable (m²)" name="surface" error={e.surface}>
          <Input name="surface" defaultValue={v.surface} error={e.surface} inputMode="decimal" />
        </Field>
        <Field label="Pièces" name="rooms" error={e.rooms}>
          <Input name="rooms" defaultValue={v.rooms} error={e.rooms} inputMode="numeric" />
        </Field>
        <Field label="Chambres" name="bedrooms" error={e.bedrooms}>
          <Input name="bedrooms" defaultValue={v.bedrooms} error={e.bedrooms} inputMode="numeric" />
        </Field>
        <Field label="Étage" name="floor" hint="Ex. : 4e sur 5, ascenseur">
          <Input name="floor" defaultValue={v.floor} />
        </Field>
        <Field label="DPE" name="dpe">
          <Select name="dpe" defaultValue={v.dpe ?? ""}>
            <option value="">Non renseigné</option>
            {ENERGY_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="GES" name="ges">
          <Select name="ges" defaultValue={v.ges ?? ""}>
            <option value="">Non renseigné</option>
            {ENERGY_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Charges annuelles (€)" name="charges" error={e.charges}>
          <Input name="charges" defaultValue={v.charges} error={e.charges} inputMode="numeric" />
        </Field>
        <Field label="Description" name="description" className="sm:col-span-2 lg:col-span-4" hint="Vos notes (atouts, rénovations, environnement…) : le Studio IA s'en sert pour rédiger l'annonce">
          <textarea id="description" name="description" rows={5} defaultValue={v.description} className={clsx(inputClasses, "h-auto py-3 leading-relaxed")} />
        </Field>
      </Section>

      <Section title="Mandat et statut">
        <Field label="Type de mandat" name="mandate_type">
          <Select name="mandate_type" defaultValue={v.mandate_type ?? ""}>
            <option value="">Pas encore de mandat</option>
            {MANDATE_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </Field>
        <Field label="Fin du mandat" name="mandate_end">
          <Input name="mandate_end" defaultValue={v.mandate_end} type="date" />
        </Field>
        <Field label="Référence interne" name="reference">
          <Input name="reference" defaultValue={v.reference} placeholder="Ex. : IMM-2026-001" />
        </Field>
        <Field label="Statut" name="status">
          <Select name="status" defaultValue={v.status ?? "brouillon"}>
            {PROPERTY_STATUSES.filter((s) => s !== "archive" || property).map((s) => <option key={s} value={s}>{STATUS_LABEL[s].label}</option>)}
          </Select>
        </Field>
      </Section>

      {state.error && (
        <p role="alert" className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{state.error}</p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <ButtonLink href={property ? `/app/biens/${property.id}` : "/app/biens"} variant="secondary" size="lg">Annuler</ButtonLink>
        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-lg bg-brand-600 px-5 text-base font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer le bien"}
        </button>
      </div>
    </form>
  );
}
