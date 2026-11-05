"use client";

import { useActionState, type ReactNode } from "react";
import clsx from "clsx";
import { saveSettings, type SettingsState } from "@/app/app/parametres/actions";
import type { Settings } from "@/lib/property-types";

const input =
  "h-11 w-full rounded-lg border border-line-strong bg-white px-3.5 text-[15px] text-ink shadow-xs outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:bg-canvas disabled:text-muted";

function Field({ label, name, hint, className, children }: { label: string; name: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={name} className="text-sm font-medium text-body">{label}</label>
      {children}
      {hint && <p className="text-[13px] text-subtle">{hint}</p>}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-line bg-white shadow-card">
      <legend className="sr-only">{title}</legend>
      <div className="border-b border-line px-5 py-4">
        <h2 aria-hidden className="text-[17px] font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveSettings, {});
  const a = settings.agency;
  const locked = !settings.canEditAgency;

  return (
    <form action={action} className="flex flex-col gap-6">
      <Section title="Mon profil">
        <Field label="Prénom et nom" name="full_name">
          <input id="full_name" name="full_name" defaultValue={settings.fullName} autoComplete="name" className={input} />
        </Field>
        <Field label="Téléphone" name="phone" hint="Affiché sur les pages publiques de vos biens">
          <input id="phone" name="phone" type="tel" defaultValue={settings.phone} autoComplete="tel" className={input} />
        </Field>
        <Field label="Email de connexion" name="email">
          <input id="email" value={settings.email} disabled className={input} />
        </Field>
      </Section>

      <Section title="Mon agence" description={locked ? "Seul le responsable de l'agence peut modifier ces informations." : "Ces informations figurent sur vos documents (mandats, rapports, plaquettes)."}>
        <Field label="Nom de l'agence" name="agency_name">
          <input id="agency_name" name="agency_name" defaultValue={a.name} disabled={locked} className={input} />
        </Field>
        <Field label="Téléphone de l'agence" name="agency_phone">
          <input id="agency_phone" name="agency_phone" type="tel" defaultValue={a.phone} disabled={locked} className={input} />
        </Field>
        <Field label="Adresse" name="agency_address" className="sm:col-span-2">
          <input id="agency_address" name="agency_address" defaultValue={a.address} disabled={locked} autoComplete="street-address" className={input} />
        </Field>
        <Field label="Email de l'agence" name="agency_email">
          <input id="agency_email" name="agency_email" type="email" defaultValue={a.email} disabled={locked} className={input} />
        </Field>
        <Field label="SIREN" name="siren">
          <input id="siren" name="siren" inputMode="numeric" defaultValue={a.siren} disabled={locked} className={input} />
        </Field>
        <Field label="N° de carte professionnelle (carte T)" name="professional_card" hint="Obligatoire sur les mandats et les annonces (loi Hoguet)">
          <input id="professional_card" name="professional_card" defaultValue={a.professionalCard} disabled={locked} className={input} />
        </Field>
        <Field label="Mention honoraires des annonces" name="fee_text" className="sm:col-span-2" hint="Ajoutée aux annonces du Studio IA et de la diffusion. Ex. : « Honoraires à la charge du vendeur. »">
          <textarea id="fee_text" name="fee_text" rows={2} defaultValue={a.feeText} disabled={locked} className={clsx(input, "h-auto py-2.5")} />
        </Field>
      </Section>

      {state.error && <p role="alert" className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{state.error}</p>}
      {state.ok && <p role="status" className="rounded-lg bg-success-50 px-4 py-3 text-sm text-success-700">Paramètres enregistrés.</p>}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="h-12 rounded-lg bg-brand-600 px-5 text-base font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
