import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PropertyThumb } from "@/components/app/property-thumb";
import { BUYERS, PROPERTIES, STATUS_LABEL, getProperty } from "@/lib/mock-data";

export function generateStaticParams() {
  return PROPERTIES.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: PageProps<"/app/biens/[id]">) {
  const { id } = await params;
  return { title: getProperty(id)?.title ?? "Bien" };
}

const fmt = (n: number | null) => (n === null ? "—" : new Intl.NumberFormat("fr-FR").format(n));

const TABS = ["Aperçu", "Contenus IA", "Visites", "Acquéreurs", "Documents", "Rapport vendeur", "Historique"];

export default async function PropertyPage({ params }: PageProps<"/app/biens/[id]">) {
  const { id } = await params;
  const p = getProperty(id);
  if (!p) notFound();
  const status = STATUS_LABEL[p.status];

  const specs = [
    ["Prix de vente", p.price ? `${fmt(p.price)} €` : "[PRIX]"],
    ["Surface habitable", `${p.surface} m²`],
    ["Pièces", p.bedrooms ? `${p.rooms} dont ${p.bedrooms} chambre${p.bedrooms > 1 ? "s" : ""}` : `${p.rooms}`],
    ["Étage", p.floor],
    ["DPE / GES", `${p.dpe} / ${p.ges}`],
    ["Charges annuelles", "[CHARGES]"],
    ["Extérieur", p.extras],
    ["Annexes", p.annexes],
  ];

  return (
    <div>
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 pt-5 lg:px-8">
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
              <p className="mt-1.5 text-sm text-muted">
                Réf. {p.ref} · {p.city} · Mandat {p.mandate.toLowerCase()} jusqu&apos;au {p.mandateEnd}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <ButtonLink href={`/app/biens/${p.id}`} variant="secondary">Partager</ButtonLink>
              <ButtonLink href={`/app/biens/${p.id}`} variant="secondary">Modifier</ButtonLink>
              <ButtonLink href="/app/studio"><Sparkles aria-hidden className="size-4" />Studio IA</ButtonLink>
            </div>
          </div>
          <nav aria-label="Sections du bien" className="-mb-px flex gap-6 overflow-x-auto text-sm font-semibold">
            {TABS.map((t, i) => (
              <span
                key={t}
                aria-current={i === 0 ? "page" : undefined}
                className={i === 0 ? "border-b-2 border-brand-600 pt-2.5 pb-3 whitespace-nowrap text-brand-700" : "pt-2.5 pb-3 whitespace-nowrap text-muted"}
              >
                {t}
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl items-start gap-6 px-5 py-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
            <div className="relative flex h-80 items-end rounded-xl p-3.5" style={{ background: p.tint }}>
              <span className="rounded-md bg-ink/75 px-2.5 py-1 text-xs font-semibold text-white">Photo principale</span>
            </div>
            <div className="grid gap-2">
              <PropertyThumb tint="#E4E7EC" className="h-full min-h-36 rounded-xl" />
              <div className="flex min-h-36 items-center justify-center rounded-xl bg-line-strong text-sm font-semibold">+ 12 photos</div>
            </div>
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
            <CardHeader
              title="Description"
              action={<span className="rounded-md border border-line px-2 py-0.5 text-xs font-semibold text-body">Générée par l&apos;IA</span>}
            />
            <p className="p-5 text-[15px] leading-relaxed text-body">{p.description}</p>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader title="Performance" action={<span className="text-[13px] text-muted">depuis la mise en ligne</span>} />
            <div className="grid grid-cols-3 divide-x divide-line">
              {[
                ["Vues", p.views],
                ["Demandes", p.requests],
                ["Visites", p.visits],
              ].map(([k, v]) => (
                <div key={k as string} className="px-5 py-4">
                  <p className="text-[13px] text-muted">{k}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{fmt(v as number | null)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Acquéreurs intéressés" action={<Link href="/app/acquereurs" className="text-[13px] font-semibold text-brand-700">Tout voir</Link>} />
            <ul className="px-5 pt-1 pb-2">
              {BUYERS.map((b) => (
                <li key={b.name} className="flex items-center gap-3 border-b border-hover py-3 last:border-0">
                  <span className="flex size-[34px] flex-none items-center justify-center rounded-full bg-hover text-xs font-semibold text-body">{b.initials}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{b.name}</p>
                    <p className="mt-0.5 text-[13px] text-muted">{b.meta}</p>
                  </div>
                  <Badge tone={b.tone}>{b.score}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
