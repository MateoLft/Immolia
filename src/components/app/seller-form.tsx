"use client";

import { useActionState, type ReactNode } from "react";
import clsx from "clsx";
import { createSeller, updateSeller, type SellerFormState } from "@/app/app/vendeurs/actions";
import { ButtonLink } from "@/components/ui/button";
import type { Seller } from "@/lib/property-types";

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

export function SellerForm({ seller, prospect = false }: { seller?: Seller; prospect?: boolean }) {
  const formAction = seller ? updateSeller.bind(null, seller.id) : createSeller;
  const [state, action, pending] = useActionState<SellerFormState, FormData>(formAction, {});
  const v = state.values ?? {
    full_name: seller?.fullName ?? "",
    email: seller?.email ?? "",
    phone: seller?.phone ?? "",
    address: seller?.address ?? "",
    notes: seller?.notes ?? "",
    next_contact_on: seller?.nextContactOn ?? "",
    is_prospect: (seller?.isProspect ?? prospect) ? "on" : "",
  };

  return (
    <form action={action} className="flex flex-col gap-6">
      <fieldset className="rounded-xl border border-line bg-white shadow-card">
        <legend className="sr-only">Vendeur</legend>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Field label="Nom et prénom *" name="full_name" className="sm:col-span-2">
            <input id="full_name" name="full_name" defaultValue={v.full_name} className={input} />
          </Field>
          <Field label="Téléphone" name="phone">
            <input id="phone" name="phone" type="tel" defaultValue={v.phone} className={input} />
          </Field>
          <Field label="Email" name="email" hint="Pour l'envoi du rapport hebdomadaire">
            <input id="email" name="email" type="email" defaultValue={v.email} className={input} />
          </Field>
          <Field label="Adresse" name="address" className="sm:col-span-2">
            <input id="address" name="address" defaultValue={v.address} className={input} />
          </Field>
          <label className="flex items-start gap-2.5 text-sm text-body sm:col-span-2">
            <input type="checkbox" name="is_prospect" defaultChecked={v.is_prospect === "on"} className="mt-0.5 size-4 accent-brand-600" />
            <span>
              <span className="font-semibold">Prospect vendeur</span>
              <span className="block text-[13px] text-subtle">Propriétaire à démarcher : pas encore de mandat signé.</span>
            </span>
          </label>
          <Field label="Date de relance" name="next_contact_on">
            <input id="next_contact_on" name="next_contact_on" type="date" defaultValue={v.next_contact_on} className={input} />
          </Field>
          <Field label="Notes" name="notes" className="sm:col-span-2">
            <textarea id="notes" name="notes" rows={3} defaultValue={v.notes} className={clsx(input, "h-auto py-2.5")} />
          </Field>
        </div>
      </fieldset>

      {state.error && <p role="alert" className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{state.error}</p>}

      <div className="flex flex-wrap justify-end gap-3">
        <ButtonLink href={seller ? `/app/vendeurs/${seller.id}` : "/app/vendeurs"} variant="secondary" size="lg">Annuler</ButtonLink>
        <button type="submit" disabled={pending} className="h-12 rounded-lg bg-brand-600 px-5 text-base font-semibold text-white shadow-xs hover:bg-brand-700 disabled:opacity-60">
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
