import Link from "next/link";
import { Suspense } from "react";
import { UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listBuyersFull, listProperties } from "@/lib/data";
import { BUYER_STATUS_LABEL, SCORE_LABEL, criteriaSummary, matches } from "@/lib/buyers";

export const metadata = { title: "Acquéreurs" };

async function BuyersList() {
  const [buyers, properties] = await Promise.all([listBuyersFull(), listProperties()]);
  if (buyers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong bg-white px-6 py-14 text-center">
        <Users aria-hidden className="size-8 text-brand-600" strokeWidth={1.6} />
        <p className="font-semibold">Aucun acquéreur pour le moment</p>
        <p className="max-w-md text-sm text-muted">Ajoutez vos acquéreurs et leurs critères : Immolia vous signale automatiquement les biens qui leur correspondent. Les demandes de visite reçues sur vos pages publiques créent aussi des acquéreurs.</p>
        <ButtonLink href="/app/acquereurs/nouveau"><UserPlus aria-hidden className="size-4" />Ajouter un acquéreur</ButtonLink>
      </div>
    );
  }
  const order = { prioritaire: 0, qualifie: 1, "a-qualifier": 2 };
  const sorted = [...buyers].sort((a, b) => (a.status === "actif" ? 0 : 1) - (b.status === "actif" ? 0 : 1) || order[a.score] - order[b.score]);

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="bg-canvas text-left text-xs text-muted">
              <th scope="col" className="px-5 py-3 font-semibold">Acquéreur</th>
              <th scope="col" className="px-3 py-3 font-semibold">Recherche</th>
              <th scope="col" className="px-3 py-3 font-semibold">Qualification</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">Biens correspondants</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => {
              const n = properties.filter((p) => matches(b, p)).length;
              return (
                <tr key={b.id} className="border-t border-line hover:bg-canvas">
                  <td className="px-5 py-3.5">
                    <Link href={`/app/acquereurs/${b.id}`} className="block font-semibold hover:text-brand-700">{b.fullName}</Link>
                    <span className="block text-[13px] text-muted">{b.phone ?? b.email ?? "Pas de coordonnées"}{b.status !== "actif" ? ` · ${BUYER_STATUS_LABEL[b.status]}` : ""}</span>
                  </td>
                  <td className="px-3 py-3.5 text-body">{criteriaSummary(b)}</td>
                  <td className="px-3 py-3.5"><Badge tone={SCORE_LABEL[b.score].tone}>{SCORE_LABEL[b.score].label}</Badge></td>
                  <td className="px-5 py-3.5 text-right">
                    {n > 0 ? <Link href={`/app/acquereurs/${b.id}`} className="font-semibold text-brand-700">{n} bien{n > 1 ? "s" : ""}</Link> : <span className="text-muted">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function BuyersPage() {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Acquéreurs</h1>
          <p className="mt-1 text-[15px] text-muted">Vos acquéreurs, leurs critères et les biens qui leur correspondent.</p>
        </div>
        <ButtonLink href="/app/acquereurs/nouveau"><UserPlus aria-hidden className="size-4" />Ajouter un acquéreur</ButtonLink>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <BuyersList />
      </Suspense>
    </div>
  );
}
