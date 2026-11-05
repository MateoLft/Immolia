import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FileSignature, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportPreview } from "@/components/app/report-preview";
import { getAccount, getSeller, listListings, listProperties, listPropertyVisits } from "@/lib/data";
import { buildSellerReport } from "@/lib/seller-report";
import { STATUS_LABEL } from "@/lib/property-types";

export const metadata = { title: "Vendeur" };

async function Detail({ params }: { params: PageProps<"/app/vendeurs/[id]">["params"] }) {
  const { id } = await params;
  const s = await getSeller(id);
  if (!s) notFound();
  const [properties, account] = await Promise.all([listProperties(), getAccount()]);
  const own = properties.filter((p) => p.sellerId === s.id);
  const reports = await Promise.all(
    own.map(async (p) => {
      const [visits, listings] = await Promise.all([listPropertyVisits(p.id), listListings(p.id)]);
      return { p, report: buildSellerReport({ property: p, visits, listings, sellerName: s.fullName, agentName: account.fullName, agencyName: account.agencyName }) };
    }),
  );

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/vendeurs" className="hover:text-ink">Vendeurs</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">{s.fullName}</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[26px] font-bold tracking-tight">{s.fullName}</h1>
            {s.isProspect && <Badge tone="brand">Prospect</Badge>}
          </div>
          <p className="mt-1.5 text-sm text-muted">{[s.phone, s.email, s.address].filter(Boolean).join(" · ") || "Coordonnées à compléter"}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink href={`/app/vendeurs/${s.id}/modifier`} variant="secondary"><Pencil aria-hidden className="size-4" />Modifier</ButtonLink>
          <ButtonLink href={`/app/mandats/nouveau?vendeur=${s.id}`}><FileSignature aria-hidden className="size-4" />Enregistrer un mandat</ButtonLink>
        </div>
      </div>

      {s.notes && (
        <Card>
          <CardHeader title="Notes" />
          <p className="p-5 text-sm whitespace-pre-line text-body">{s.notes}</p>
        </Card>
      )}

      {own.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong bg-white px-6 py-10 text-center text-sm text-muted">
          Aucun bien rattaché. Ouvrez un bien, cliquez sur « Modifier » et choisissez ce vendeur dans le champ « Vendeur ».
        </p>
      ) : (
        reports.map(({ p, report }) => (
          <Card key={p.id}>
            <CardHeader
              title={`Rapport de la semaine · ${p.title}`}
              description={`${STATUS_LABEL[p.status].label} · ${report.stats.visitsInPeriod} visite(s) cette semaine · ${report.stats.upcoming} à venir`}
              action={<Link href={`/app/biens/${p.id}`} className="text-[13px] font-semibold text-brand-700">Voir le bien</Link>}
            />
            <div className="p-5">
              <ReportPreview subject={report.subject} text={report.text} email={s.email} />
            </div>
          </Card>
        ))
      )}
      <p className="text-xs text-subtle">L&apos;envoi automatique chaque lundi sera activé avec un service d&apos;email (nécessite un nom de domaine). En attendant, le bouton ouvre votre messagerie avec le rapport prêt à envoyer.</p>
    </>
  );
}

export default function SellerPage({ params }: PageProps<"/app/vendeurs/[id]">) {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Detail params={params} />
      </Suspense>
    </div>
  );
}
