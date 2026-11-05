import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyThumb } from "@/components/app/property-thumb";
import { countDocumentsByProperty, listProperties } from "@/lib/data";
import { requiredKinds } from "@/lib/documents";
import { STATUS_LABEL, tintFor } from "@/lib/property-types";

export const metadata = { title: "Dossiers de vente" };

async function Overview() {
  const [properties, counts] = await Promise.all([listProperties(), countDocumentsByProperty()]);
  if (properties.length === 0) return <p className="rounded-xl border border-dashed border-line-strong bg-white px-6 py-12 text-center text-sm text-muted">Ajoutez un bien pour préparer son dossier de vente.</p>;
  return (
    <Card className="overflow-hidden">
      <ul>
        {properties.map((p) => {
          const required = requiredKinds(p.kind, Boolean(p.annualCharges));
          const have = counts.get(p.id) ?? new Set();
          const done = required.filter((k) => have.has(k.value)).length;
          const pct = Math.round((done / required.length) * 100);
          return (
            <li key={p.id} className="border-b border-line last:border-0">
              <Link href={`/app/biens/${p.id}/dossier`} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-canvas">
                <PropertyThumb tint={tintFor(p.id)} src={p.coverUrl} className="h-11 w-14" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.title}</span>
                  <span className="block text-[13px] text-muted">{p.city} · {STATUS_LABEL[p.status].label}</span>
                </span>
                <span className="flex w-48 flex-col gap-1.5">
                  <span className="text-right text-[13px] font-semibold">{done} / {required.length} pièces</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-line" aria-hidden><span className="block h-full rounded-full bg-success-700" style={{ width: `${pct}%` }} /></span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default function DossiersPage() {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Dossiers de vente</h1>
        <p className="mt-1 text-[15px] text-muted">Les pièces à réunir pour chaque bien, avec la synthèse des PV d&apos;AG et des diagnostics par l&apos;IA.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Overview />
      </Suspense>
    </div>
  );
}
