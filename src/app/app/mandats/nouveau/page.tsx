import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MandateForm } from "@/components/app/mandate-form";
import { getSettings, listProperties, listSellers } from "@/lib/data";
import { parisToday } from "@/lib/paris-time";

export const metadata = { title: "Inscrire un mandat" };

async function Form({ searchParams }: { searchParams: PageProps<"/app/mandats/nouveau">["searchParams"] }) {
  const { vendeur, bien } = await searchParams;
  const [properties, sellers, settings] = await Promise.all([listProperties(), listSellers(), getSettings()]);
  return (
    <MandateForm
      properties={properties.map((p) => ({ id: p.id, title: p.title, city: p.city, sellerId: p.sellerId, price: p.price }))}
      sellers={sellers}
      defaults={{
        today: parisToday(),
        sellerId: typeof vendeur === "string" ? vendeur : undefined,
        propertyId: typeof bien === "string" ? bien : undefined,
        feeText: settings.agency.feeText,
      }}
    />
  );
}

export default function NewMandatePage({ searchParams }: PageProps<"/app/mandats/nouveau">) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-7 lg:px-8">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/mandats" className="hover:text-ink">Mandats</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">Inscrire un mandat</span>
      </nav>
      <h1 className="text-[26px] font-bold tracking-tight">Inscrire un mandat au registre</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
