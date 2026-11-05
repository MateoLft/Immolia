import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LogoMark } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { EstimationForm } from "@/components/public/estimation-form";
import { anonClient } from "@/lib/public-property";
import { isSupabaseConfigured } from "@/lib/supabase/config";

async function getAgency(slug: string) {
  if (!isSupabaseConfigured || !/^[a-z0-9-]{3,80}$/.test(slug)) return null;
  const { data } = await anonClient().rpc("get_public_agency", { p_slug: slug });
  return (data as { name: string; phone: string | null; email: string | null } | null) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/estimation/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getAgency(slug);
  return agency
    ? { title: `Estimation gratuite de votre bien – ${agency.name}`, description: `Recevez une estimation de votre bien par ${agency.name}.` }
    : { title: "Page introuvable", robots: { index: false } };
}

async function Content({ params }: { params: PageProps<"/estimation/[slug]">["params"] }) {
  const { slug } = await params;
  const agency = await getAgency(slug);
  if (!agency) notFound();
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <span className="text-lg font-bold">{agency.name}</span>
          {agency.phone && <a href={`tel:${agency.phone.replace(/\s/g, "")}`} className="text-sm font-semibold text-brand-700">{agency.phone}</a>}
        </div>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Combien vaut votre bien ?</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">Décrivez votre bien en 1 minute : un conseiller de {agency.name} étudie le marché local et vous adresse un avis de valeur gratuit et sans engagement.</p>
        </div>
        <section className="relative rounded-xl border border-line bg-white p-6 shadow-card">
          <EstimationForm slug={slug} agencyName={agency.name} />
        </section>
        <footer className="flex items-center justify-end gap-1.5 text-xs text-subtle"><LogoMark size={16} />Service proposé avec Immolia</footer>
      </main>
    </div>
  );
}

export default function EstimationPage({ params }: PageProps<"/estimation/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-5 py-8"><Skeleton className="h-96 w-full" /></div>}>
      <Content params={params} />
    </Suspense>
  );
}
