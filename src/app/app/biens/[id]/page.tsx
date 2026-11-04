import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ImagePlus, Pencil, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UpcomingVisits } from "@/components/app/upcoming-visits";
import { getProperty, listUpcomingVisits } from "@/lib/data";
import {
  STATUS_LABEL,
  formatEuros,
  formatNumber,
  kindLabel,
  mandateLabel,
  tintFor,
  type Property,
} from "@/lib/property-types";

export const metadata = { title: "Fiche du bien" };

const dateFr = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris" }).format(new Date(iso)) : null;

function PropertyHeader({ p }: { p: Property }) {
  const status = STATUS_LABEL[p.status];
  const meta = [
    p.reference ? `Réf. ${p.reference}` : null,
    [p.postalCode, p.city].filter(Boolean).join(" "),
    p.mandateType ? `Mandat ${mandateLabel(p.mandateType).toLowerCase()}${p.mandateEnd ? ` jusqu'au ${dateFr(p.mandateEnd)}` : ""}` : "Sans mandat",
  ].filter(Boolean);

  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 lg:px-8">
        <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Link href="/app" className="hover:text-ink">Tableau de bord</Link>
          <span aria-hidden>/</span>
          <Link href="/app/biens" className="hover:text-ink">Biens</Link>
          <span aria-hidden>/</span>
          <span className="font-medium text-ink">{p.title}</span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[26px] font-bold tracking-tight">{p.title}</h1>
              <Badge tone={status.tone} dot>{status.label}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted">{meta.join(" · ")}</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <ButtonLink href={`/app/biens/${p.id}/modifier`} variant="secondary"><Pencil aria-hidden className="size-4" />Modifier</ButtonLink>
            <ButtonLink href={`/app/studio/${p.id}`}><Sparkles aria-hidden className="size-4" />Studio IA</ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}

async function PropertyDetails({ params }: { params: PageProps<"/app/biens/[id]">["params"] }) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) notFound();

  const specs: [string, string][] = [
    ["Type", kindLabel(p.kind)],
    ["Prix de vente", formatEuros(p.price)],
    ["Surface habitable", p.surface ? `${formatNumber(p.surface)} m²` : "—"],
    ["Pièces", p.rooms ? (p.bedrooms ? `${p.rooms} dont ${p.bedrooms} chambre${p.bedrooms > 1 ? "s" : ""}` : `${p.rooms}`) : "—"],
    ["Étage", p.floor ?? "—"],
    ["DPE / GES", p.dpe || p.ges ? `${p.dpe ?? "—"} / ${p.ges ?? "—"}` : "—"],
    ["Charges annuelles", formatEuros(p.annualCharges)],
    ["Adresse", p.address ?? "—"],
  ];

  return (
    <>
      <PropertyHeader p={p} />
      <div className="mx-auto grid max-w-7xl items-start gap-6 px-5 py-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl text-center" style={{ background: tintFor(p.id) }}>
            <ImagePlus aria-hidden className="size-7 text-body" strokeWidth={1.6} />
            <p className="text-sm font-semibold text-body">Photos : bientôt disponible</p>
          </div>

          <Card>
            <CardHeader title="Caractéristiques" />
            <dl className="grid sm:grid-cols-2 lg:grid-cols-4">
              {specs.map(([k, v]) => (
                <div key={k} className="border-b border-hover px-5 py-4">
                  <dt className="text-[13px] text-muted">{k}</dt>
                  <dd className="mt-1 text-[15px] font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Description" />
            {p.description ? (
              <p className="p-5 text-[15px] leading-relaxed whitespace-pre-line text-body">{p.description}</p>
            ) : (
              <p className="p-5 text-[15px] text-muted">Pas encore de description. Cliquez sur « Modifier » pour ajouter vos notes de visite : le Studio IA s&apos;en servira pour rédiger l&apos;annonce.</p>
            )}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Performance" />
            <div className="grid grid-cols-2 divide-x divide-line">
              <div className="px-5 py-4">
                <p className="text-[13px] text-muted">Vues</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{formatNumber(p.views)}</p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[13px] text-muted">Visites</p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{formatNumber(p.visitsCount)}</p>
              </div>
            </div>
            <p className="border-t border-line px-5 py-3 text-[13px] text-muted">Ajouté le {dateFr(p.createdAt)}</p>
          </Card>

          <Card>
            <CardHeader title="Prochaines visites" />
            <UpcomingVisits visits={await listUpcomingVisits({ propertyId: p.id })} showProperty={false} />
          </Card>
        </div>
      </div>
    </>
  );
}

export default function PropertyPage({ params }: PageProps<"/app/biens/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4 px-5 py-7 lg:px-8">
          <Skeleton className="h-5 w-60" />
          <Skeleton className="h-8 w-96 max-w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <PropertyDetails params={params} />
    </Suspense>
  );
}
