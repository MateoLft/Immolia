import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CalendarPlus, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyThumb } from "@/components/app/property-thumb";
import { SendProperty } from "@/components/app/send-property";
import { getAccount, getBuyer, listBuyerVisits, listProperties } from "@/lib/data";
import { BUYER_STATUS_LABEL, SCORE_LABEL, criteriaSummary, matches, propertyPitch } from "@/lib/buyers";
import { formatEuros, tintFor } from "@/lib/property-types";
import { publicPropertyPath, siteUrl } from "@/lib/site-url";

export const metadata = { title: "Acquéreur" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });

async function Detail({ params }: { params: PageProps<"/app/acquereurs/[id]">["params"] }) {
  const { id } = await params;
  const b = await getBuyer(id);
  if (!b) notFound();
  const [properties, visits, base, account] = await Promise.all([listProperties(), listBuyerVisits(b.id), siteUrl(), getAccount()]);
  const matching = properties.filter((p) => matches(b, p));
  const firstName = b.fullName.split(/\s+/)[0];

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/acquereurs" className="hover:text-ink">Acquéreurs</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">{b.fullName}</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] font-bold tracking-tight">{b.fullName}</h1>
            <Badge tone={SCORE_LABEL[b.score].tone}>{SCORE_LABEL[b.score].label}</Badge>
            {b.status !== "actif" && <Badge>{BUYER_STATUS_LABEL[b.status]}</Badge>}
          </div>
          <p className="mt-1.5 text-sm text-muted">{[b.phone, b.email, b.financing].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink href={`/app/acquereurs/${b.id}/modifier`} variant="secondary"><Pencil aria-hidden className="size-4" />Modifier</ButtonLink>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader
            title={`Biens correspondants (${matching.length})`}
            description={criteriaSummary(b)}
          />
          {matching.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted">
              {b.status !== "actif" ? "Cet acquéreur n'est plus en recherche." : "Aucun bien de votre portefeuille ne correspond pour l'instant. Immolia l'affichera ici dès qu'un bien correspondra."}
            </p>
          ) : (
            <ul>
              {matching.map((p) => {
                const link = p.published && p.publicSlug ? `${base}${publicPropertyPath(p.publicSlug)}` : null;
                return (
                  <li key={p.id} className="flex flex-col gap-3 border-b border-hover px-5 py-4 last:border-0 lg:flex-row lg:items-center lg:justify-between">
                    <Link href={`/app/biens/${p.id}`} className="flex min-w-0 items-center gap-3">
                      <PropertyThumb tint={tintFor(p.id)} src={p.coverUrl} className="h-12 w-14" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{p.title}</span>
                        <span className="block text-[13px] text-muted">{p.city} · {formatEuros(p.price)}{!link ? " · page publique non publiée" : ""}</span>
                      </span>
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                      <SendProperty
                        email={b.email}
                        phone={b.phone}
                        subject={`Un bien pour vous : ${p.title}`}
                        message={`${propertyPitch(p, link, firstName)}\n\n${account.fullName}${account.agencyName ? ` – ${account.agencyName}` : ""}`}
                      />
                      <ButtonLink href={`/app/visites/nouvelle?bien=${p.id}`} variant="secondary" size="sm"><CalendarPlus aria-hidden className="size-4" />Visite</ButtonLink>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Visites" />
            {visits.length === 0 ? (
              <p className="px-5 py-5 text-sm text-muted">Aucune visite pour le moment.</p>
            ) : (
              <ul className="px-5 py-2">
                {visits.map((v) => (
                  <li key={v.id} className="border-b border-hover py-3 last:border-0">
                    <p className="text-sm font-semibold">{v.propertyTitle}</p>
                    <p className="text-[13px] text-muted">
                      {dateFmt.format(new Date(v.startsAt))} · {v.status === "realisee" ? "réalisée" : v.status === "annulee" ? "annulée" : "prévue"}
                    </p>
                    {v.feedback && <p className="mt-1 text-sm whitespace-pre-line text-body">{v.feedback}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {b.notes && (
            <Card>
              <CardHeader title="Notes" />
              <p className="p-5 text-sm whitespace-pre-line text-body">{b.notes}</p>
            </Card>
          )}
          <p className="text-xs text-subtle">Ajouté le {dateFmt.format(new Date(b.createdAt))}{b.source ? ` · ${b.source}` : ""}</p>
        </div>
      </div>
    </>
  );
}

export default function BuyerPage({ params }: PageProps<"/app/acquereurs/[id]">) {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Detail params={params} />
      </Suspense>
    </div>
  );
}
