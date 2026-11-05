import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AlertTriangle, Pencil, Send, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UpcomingVisits } from "@/components/app/upcoming-visits";
import QRCode from "qrcode";
import { getProperty, listGeneratedContents, listListings, listPropertyPhotos, listUpcomingVisits } from "@/lib/data";
import { PORTALS } from "@/lib/portals";
import { publicPropertyPath, siteUrl } from "@/lib/site-url";
import { PublicationCard } from "@/components/app/publication-card";
import { PhotoManager } from "@/components/app/photo-manager";
import {
  OFF_MARKET_STATUSES,
  STATUS_LABEL,
  formatEuros,
  formatNumber,
  kindLabel,
  mandateLabel,
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
            <ButtonLink href={`/app/biens/${p.id}/diffuser`} variant="secondary"><Send aria-hidden className="size-4" />Diffuser</ButtonLink>
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

  const [photos, contents, base, listings] = await Promise.all([
    listPropertyPhotos(p.id),
    listGeneratedContents(p.id),
    siteUrl(),
    listListings(p.id),
  ]);
  const liveListings = listings.filter((l) => l.status === "publie");
  const mustRemove = OFF_MARKET_STATUSES.includes(p.status) && liveListings.length > 0;
  const portalName = (id: string) => PORTALS.find((x) => x.id === id)?.name ?? id;
  const publicUrl = p.publicSlug ? `${base}${publicPropertyPath(p.publicSlug)}` : null;
  const [qrSvg, qrPng] = publicUrl
    ? await Promise.all([
        QRCode.toString(publicUrl, { type: "svg", margin: 1, color: { dark: "#101828", light: "#ffffff" } }),
        QRCode.toDataURL(publicUrl, { width: 1024, margin: 2 }),
      ])
    : [null, null];
  const latestAnnonce = contents.find((c) => c.kind === "annonce")?.content ?? null;

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
          <PhotoManager propertyId={p.id} photos={photos} />

          <PublicationCard
            propertyId={p.id}
            published={p.published}
            publicUrl={publicUrl}
            qrSvg={qrSvg}
            qrPng={qrPng}
            publicDescription={p.publicDescription}
            latestAnnonce={latestAnnonce}
          />

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
            <CardHeader title="Notes de l'agent" description="Internes : jamais affichées sur la page publique" />
            {p.description ? (
              <p className="p-5 text-[15px] leading-relaxed whitespace-pre-line text-body">{p.description}</p>
            ) : (
              <p className="p-5 text-[15px] text-muted">Pas encore de description. Cliquez sur « Modifier » pour ajouter vos notes de visite : le Studio IA s&apos;en servira pour rédiger l&apos;annonce.</p>
            )}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          {mustRemove && (
            <div role="alert" className="flex gap-3 rounded-xl border border-warning-500/40 bg-warning-50 p-4 text-sm text-warning-700">
              <AlertTriangle aria-hidden className="size-5 flex-none" />
              <p>
                Ce bien est « {STATUS_LABEL[p.status].label.toLowerCase()} » : pensez à retirer l&apos;annonce de{" "}
                <strong>{liveListings.map((l) => portalName(l.portal)).join(", ")}</strong>, puis indiquez-le dans{" "}
                <Link href={`/app/biens/${p.id}/diffuser`} className="font-semibold underline">Diffuser</Link>.
              </p>
            </div>
          )}

          <Card>
            <CardHeader title="Diffusion" action={<Link href={`/app/biens/${p.id}/diffuser`} className="text-[13px] font-semibold text-brand-700">Diffuser</Link>} />
            <ul className="px-5 py-2">
              {PORTALS.map((portal) => {
                const l = listings.find((x) => x.portal === portal.id);
                return (
                  <li key={portal.id} className="flex items-center justify-between gap-3 border-b border-hover py-2.5 text-sm last:border-0">
                    <span className="font-medium">{portal.name}</span>
                    {l?.status === "publie" ? (
                      l.url ? (
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-success-700 underline">En ligne</a>
                      ) : (
                        <span className="font-semibold text-success-700">En ligne</span>
                      )
                    ) : (
                      <span className="text-muted">{l?.status === "retire" ? "Retirée" : "Non diffusée"}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>

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
            <CardHeader title="Prochaines visites" action={<Link href={`/app/visites/nouvelle?bien=${p.id}`} className="text-[13px] font-semibold text-brand-700">Planifier</Link>} />
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
