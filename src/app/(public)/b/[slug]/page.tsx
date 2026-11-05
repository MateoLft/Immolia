import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { EnergyLabel } from "@/components/public/energy-label";
import { VisitRequestForm } from "@/components/public/visit-request-form";
import { AssistantWidget } from "@/components/public/assistant-widget";
import { isAiConfigured } from "@/lib/ai";
import { getPublicProperty } from "@/lib/public-property";
import { formatEuros, formatNumber, kindLabel } from "@/lib/property-types";

export async function generateMetadata({ params }: PageProps<"/b/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublicProperty(slug);
  if (!p) return { title: "Annonce introuvable", robots: { index: false } };
  const facts = [kindLabel(p.kind), p.surface ? `${formatNumber(p.surface)} m²` : null, p.city].filter(Boolean).join(" · ");
  return {
    title: `${p.title} – ${p.city}`,
    description: `${facts}${p.price ? ` · ${formatEuros(p.price)}` : ""} — ${p.agencyName}`,
    openGraph: { title: p.title, description: facts, images: p.photos[0] ? [p.photos[0]] : undefined },
  };
}

async function PublicListing({ params }: { params: PageProps<"/b/[slug]">["params"] }) {
  const { slug } = await params;
  const p = await getPublicProperty(slug);
  if (!p) notFound();

  const sold = p.status === "vendu";
  const facts: [string, string][] = [
    ["Type", kindLabel(p.kind)],
    ["Surface", p.surface ? `${formatNumber(p.surface)} m²` : "—"],
    ["Pièces", p.rooms ? `${p.rooms}` : "—"],
    ["Chambres", p.bedrooms !== null ? `${p.bedrooms}` : "—"],
    ["Étage", p.floor ?? "—"],
    ["Charges annuelles", formatEuros(p.annualCharges)],
  ];
  const [cover, ...others] = p.photos;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <span className="text-lg font-bold">{p.agencyName}</span>
          {p.agentPhone && (
            <a href={`tel:${p.agentPhone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm font-semibold text-brand-700">
              <Phone aria-hidden className="size-4" />{p.agentPhone}
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-6">
        {p.photos.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire du stockage privé */}
            <img src={cover} alt={`Photo principale : ${p.title}`} className="aspect-[4/3] w-full rounded-xl object-cover sm:aspect-auto sm:h-[440px]" />
            {others.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:grid-rows-2">
                {others.slice(0, 2).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire du stockage privé
                  <img key={url} src={url} alt={`Photo ${i + 2} : ${p.title}`} className="aspect-[4/3] w-full rounded-xl object-cover sm:aspect-auto sm:h-[216px]" />
                ))}
              </div>
            )}
          </div>
        ) : null}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-6">
            <section className="rounded-xl border border-line bg-white p-6 shadow-card">
              {sold && <p className="mb-3 inline-block rounded-full bg-success-50 px-3 py-1 text-sm font-semibold text-success-700">Vendu</p>}
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{p.title}</h1>
              <p className="mt-1.5 text-[15px] text-muted">{[p.postalCode, p.city].filter(Boolean).join(" ")}</p>
              {p.price && <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums">{formatEuros(p.price)}</p>}
              <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {facts.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[13px] text-muted">{k}</dt>
                    <dd className="mt-0.5 font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {p.description && (
              <section className="rounded-xl border border-line bg-white p-6 shadow-card">
                <h2 className="text-lg font-semibold">Description</h2>
                <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-body">{p.description}</p>
              </section>
            )}

            <section className="grid gap-6 rounded-xl border border-line bg-white p-6 shadow-card sm:grid-cols-2">
              <EnergyLabel title="Diagnostic de performance énergétique (DPE)" value={p.dpe} />
              <EnergyLabel title="Émissions de gaz à effet de serre (GES)" value={p.ges} />
            </section>

            {others.length > 2 && (
              <section className="rounded-xl border border-line bg-white p-6 shadow-card">
                <h2 className="text-lg font-semibold">Toutes les photos</h2>
                <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {others.slice(2).map((url, i) => (
                    <li key={url}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- URL signée temporaire du stockage privé */}
                      <img src={url} alt={`Photo ${i + 4} : ${p.title}`} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside id="visite" className="flex scroll-mt-6 flex-col gap-4 rounded-xl border border-line bg-white p-6 shadow-card lg:sticky lg:top-6">
            <div>
              <h2 className="text-lg font-semibold">{sold ? "Contacter l'agence" : "Visiter ce bien"}</h2>
              <p className="mt-1 text-sm text-muted">
                {p.agentName ? `${p.agentName} · ` : ""}{p.agencyName}
              </p>
            </div>
            <VisitRequestForm slug={slug} agencyName={p.agencyName} />
          </aside>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 pb-8 text-xs text-subtle">
          <span>{p.reference ? `Réf. ${p.reference} · ` : ""}Annonce non contractuelle. Honoraires : se renseigner auprès de l&apos;agence.</span>
          <span className="flex items-center gap-1.5"><LogoMark size={16} />Page créée avec Immolia</span>
        </footer>
      </main>
      {isAiConfigured() && !sold && <AssistantWidget slug={slug} />}
    </div>
  );
}

export default function PublicPropertyPage({ params }: PageProps<"/b/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <PublicListing params={params} />
    </Suspense>
  );
}
