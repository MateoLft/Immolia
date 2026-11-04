"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { COMPARISON, PLAN_ORDER, PLANS, formatPrice } from "@/lib/plans";

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="flex flex-col items-center gap-10">
      <div role="group" aria-label="Période de facturation" className="flex gap-1 rounded-[10px] border border-line bg-hover p-1">
        {[
          { value: false, label: "Mensuel" },
          { value: true, label: "Annuel" },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            aria-pressed={annual === opt.value}
            onClick={() => setAnnual(opt.value)}
            className={clsx(
              "rounded-[7px] px-4 py-2.5 text-sm font-semibold",
              annual === opt.value ? "bg-white text-ink shadow-xs" : "text-muted hover:text-ink",
            )}
          >
            {opt.label}
            {opt.value && <span className="ml-1 text-success-700">−17 %</span>}
          </button>
        ))}
      </div>

      <div className="grid w-full gap-6 md:grid-cols-3">
        {PLAN_ORDER.map((id, i) => {
          const plan = PLANS[id];
          const price = annual ? plan.yearlyPerMonth : plan.monthly;
          return (
            <div
              key={id}
              className={clsx(
                "flex flex-col gap-5 rounded-2xl bg-white p-8",
                plan.recommended ? "border-2 border-brand-600 shadow-pop" : "border border-line shadow-card",
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  {plan.recommended && <Badge tone="brand">Recommandé</Badge>}
                </div>
                <p className="mt-1.5 text-[15px] text-muted">{plan.tagline}</p>
              </div>
              <p className="flex items-baseline gap-1.5">
                <span className="text-[44px] font-bold tracking-tight tabular-nums">{formatPrice(price)} €</span>
                <span className="text-[15px] text-subtle">HT / mois</span>
              </p>
              <ButtonLink
                href="/inscription"
                variant={plan.recommended ? "primary" : "secondary"}
                size="lg"
              >
                {plan.cta}
              </ButtonLink>
              <ul className="flex flex-col gap-3 border-t border-line pt-5">
                {i > 0 && (
                  <li className="text-sm font-semibold text-ink">
                    Tout {PLANS[PLAN_ORDER[i - 1]].name}, plus :
                  </li>
                )}
                {plan.highlights.map((h) => (
                  <li key={h} className="flex gap-2.5 text-[15px] text-body">
                    <span className="mt-0.5 flex size-5 flex-none items-center justify-center rounded-full bg-brand-50">
                      <Check aria-hidden className="size-3 text-brand-700" strokeWidth={3} />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-subtle">
        {annual ? "Facturation annuelle : 2 mois offerts." : "Facturation mensuelle, sans engagement."}
      </p>

      <div className="w-full overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[720px] border-collapse text-[15px]">
          <caption className="px-6 pt-5 pb-2 text-left text-lg font-semibold">Comparer les offres</caption>
          <thead>
            <tr className="text-left text-[13px] text-muted">
              <th scope="col" className="border-b border-line px-6 py-3.5 font-semibold">Fonctionnalité</th>
              {PLAN_ORDER.map((id) => (
                <th key={id} scope="col" className={clsx("border-b border-line px-6 py-3.5 font-semibold", PLANS[id].recommended && "text-brand-700")}>
                  {PLANS[id].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row) => (
              <tr key={row.feature}>
                <th scope="row" className="border-b border-hover px-6 py-3.5 text-left font-medium">{row.feature}</th>
                {PLAN_ORDER.map((id) => {
                  const v = row.values[id];
                  return (
                    <td key={id} className="border-b border-hover px-6 py-3.5 text-muted">
                      {v === true ? (
                        <Check aria-label="Inclus" className="size-5 text-brand-700" strokeWidth={2.5} />
                      ) : v === false ? (
                        <span aria-label="Non inclus">—</span>
                      ) : (
                        v
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
