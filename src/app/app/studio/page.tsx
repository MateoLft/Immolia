import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyThumb } from "@/components/app/property-thumb";
import { listProperties } from "@/lib/data";
import { STATUS_LABEL, tintFor } from "@/lib/property-types";

export const metadata = { title: "Studio IA" };

async function PropertyPicker() {
  const properties = await listProperties();
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong bg-white px-6 py-14 text-center">
        <p className="font-semibold">Ajoutez d&apos;abord un bien</p>
        <p className="max-w-sm text-sm text-muted">Le Studio IA rédige les contenus à partir de la fiche du bien.</p>
        <ButtonLink href="/app/biens/nouveau"><Plus aria-hidden className="size-4" strokeWidth={2.4} />Ajouter un bien</ButtonLink>
      </div>
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {properties.map((p) => (
        <li key={p.id}>
          <Link
            href={`/app/studio/${p.id}`}
            className="flex items-center gap-3.5 rounded-xl border border-line bg-white p-4 shadow-card hover:border-brand-600"
          >
            <PropertyThumb tint={tintFor(p.id)} className="h-12 w-14" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{p.title}</span>
              <span className="mt-1 flex items-center gap-2 text-[13px] text-muted">
                {p.city} <Badge tone={STATUS_LABEL[p.status].tone}>{STATUS_LABEL[p.status].label}</Badge>
              </span>
            </span>
            <ChevronRight aria-hidden className="size-5 text-subtle" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function StudioPage() {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Studio IA</h1>
        <p className="mt-1 text-[15px] text-muted">Choisissez un bien : le Studio rédige son annonce et ses posts pour les réseaux sociaux.</p>
      </div>
      <Suspense fallback={<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>}>
        <PropertyPicker />
      </Suspense>
    </div>
  );
}
