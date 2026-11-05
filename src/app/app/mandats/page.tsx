import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AlertTriangle, Download, FilePlus2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MandateStatusSelect } from "@/components/app/mandate-status";
import { PrintButton } from "@/components/app/print-button";
import { getSettings, listMandates, listSellers } from "@/lib/data";
import { parisToday } from "@/lib/paris-time";
import { formatEuros, mandateLabel } from "@/lib/property-types";

export const metadata = { title: "Mandats" };

const d = (iso: string | null) => (iso ? new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`)) : "—");

function daysUntil(date: string, today: string) {
  return Math.round((new Date(`${date}T12:00:00Z`).getTime() - new Date(`${today}T12:00:00Z`).getTime()) / 86_400_000);
}

async function Registry() {
  await connection(); // la date du jour est calculée à chaque requête
  const [mandates, sellers, settings] = await Promise.all([listMandates(), listSellers(), getSettings()]);
  const today = parisToday();
  const expiring = mandates.filter((m) => m.status === "en-cours" && m.endsOn && daysUntil(m.endsOn, today) <= 30);
  const prospects = sellers.filter((s) => s.isProspect);

  return (
    <>
      {expiring.length > 0 && (
        <div role="alert" className="flex gap-3 rounded-xl border border-warning-500/40 bg-warning-50 p-4 text-sm text-warning-700 print:hidden">
          <AlertTriangle aria-hidden className="size-5 flex-none" />
          <div>
            <p className="font-semibold">{expiring.length} mandat{expiring.length > 1 ? "s arrivent" : " arrive"} à échéance dans les 30 jours</p>
            <ul className="mt-1">
              {expiring.map((m) => {
                const n = daysUntil(m.endsOn!, today);
                return <li key={m.id}>N° {m.number} · {m.sellerName} · {m.propertyLabel} — {n < 0 ? `échu depuis ${-n} j` : n === 0 ? "aujourd'hui" : `dans ${n} j`}</li>;
              })}
            </ul>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="hidden border-b border-line px-5 py-4 print:block">
          <p className="text-lg font-bold">Registre des mandats — {settings.agency.name}</p>
          <p className="text-sm">{[settings.agency.address, settings.agency.professionalCard && `Carte professionnelle n° ${settings.agency.professionalCard}`].filter(Boolean).join(" · ")}</p>
          <p className="text-sm">Édité le {d(today)}</p>
        </div>
        {mandates.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">Le registre est vide. Inscrivez votre premier mandat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="bg-canvas text-left text-xs text-muted">
                  <th scope="col" className="px-4 py-3 font-semibold">N°</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Signé le</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Mandant</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Bien</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Fin</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Prix</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Honoraires</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {mandates.map((m) => (
                  <tr key={m.id} className="border-t border-line align-top">
                    <td className="px-4 py-3 font-bold tabular-nums">{m.number}</td>
                    <td className="px-3 py-3 tabular-nums">{d(m.signedOn)}</td>
                    <td className="px-3 py-3">{m.sellerId ? <Link href={`/app/vendeurs/${m.sellerId}`} className="font-medium hover:text-brand-700">{m.sellerName}</Link> : m.sellerName}</td>
                    <td className="px-3 py-3">{m.propertyId ? <Link href={`/app/biens/${m.propertyId}`} className="hover:text-brand-700">{m.propertyLabel}</Link> : m.propertyLabel}</td>
                    <td className="px-3 py-3">{mandateLabel(m.type)}</td>
                    <td className="px-3 py-3 tabular-nums">{d(m.endsOn)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatEuros(m.price)}</td>
                    <td className="px-3 py-3 text-body">{m.feeText ?? "—"}</td>
                    <td className="px-4 py-3"><MandateStatusSelect id={m.id} status={m.status} number={m.number} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="print:hidden">
        <CardHeader
          title={`Prospects vendeurs (${prospects.length})`}
          description="Propriétaires à démarcher pour rentrer un mandat"
          action={<Link href="/app/vendeurs/nouveau?prospect=1" className="text-[13px] font-semibold text-brand-700">Ajouter un prospect</Link>}
        />
        {prospects.length === 0 ? (
          <p className="px-5 py-5 text-sm text-muted">Aucun prospect. Notez ici les propriétaires rencontrés (estimation, voisinage, recommandation) et la date à laquelle les relancer.</p>
        ) : (
          <ul className="px-5 py-2">
            {prospects.map((s) => {
              const due = s.nextContactOn && s.nextContactOn <= today;
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-hover py-3 last:border-0">
                  <Link href={`/app/vendeurs/${s.id}`} className="font-semibold hover:text-brand-700">{s.fullName}</Link>
                  <span className="flex items-center gap-2 text-sm">
                    {s.nextContactOn ? <span className={due ? "font-semibold text-warning-700" : "text-muted"}>{due ? "À relancer" : "Relance le"} {d(s.nextContactOn)}</span> : <span className="text-muted">Pas de relance prévue</span>}
                    <ButtonLink href={`/app/mandats/nouveau?vendeur=${s.id}`} size="sm" variant="secondary">Mandat signé</ButtonLink>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {mandates.length > 0 && <Badge className="self-start print:hidden">{mandates.length} mandat{mandates.length > 1 ? "s" : ""} au registre</Badge>}
    </>
  );
}

export default function MandatesPage() {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Mandats</h1>
          <p className="mt-1 text-[15px] text-muted">Registre des mandats numéroté, échéances et prospects vendeurs.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <PrintButton label="Imprimer le registre" />
          <a href="/app/mandats/registre.csv" className="flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-white px-4 text-sm font-semibold text-body shadow-xs hover:bg-canvas">
            <Download aria-hidden className="size-4" />Export CSV
          </a>
          <ButtonLink href="/app/mandats/nouveau"><FilePlus2 aria-hidden className="size-4" />Inscrire un mandat</ButtonLink>
        </div>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Registry />
      </Suspense>
    </div>
  );
}
