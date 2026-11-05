import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EstimationEditor } from "@/components/app/estimation-editor";
import { getEstimationRequest, listProperties } from "@/lib/data";
import { comparables } from "@/lib/estimation";
import { isAiConfigured } from "@/lib/ai";
import { formatEuros, formatNumber, kindLabel, STATUS_LABEL } from "@/lib/property-types";

export const metadata = { title: "Estimation" };

async function Detail({ params }: { params: PageProps<"/app/estimations/[id]">["params"] }) {
  const { id } = await params;
  const r = await getEstimationRequest(id);
  if (!r) notFound();
  const { list, median } = comparables(await listProperties(), r.city, r.kind);
  const suggestion = median && r.surface ? { low: Math.round((median * r.surface * 0.93) / 1000) * 1000, high: Math.round((median * r.surface * 1.07) / 1000) * 1000 } : null;

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/estimations" className="hover:text-ink">Estimations</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">{r.fullName}</span>
      </nav>
      <h1 className="text-[26px] font-bold tracking-tight">{kindLabel(r.kind)} à {r.city}</h1>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <EstimationEditor request={r} suggestion={suggestion} aiReady={isAiConfigured()} />
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Le bien et le propriétaire" />
            <dl className="flex flex-col gap-2 p-5 text-sm">
              {[
                ["Propriétaire", r.fullName],
                ["Téléphone", r.phone],
                ["Email", r.email],
                ["Adresse", r.address],
                ["Surface", r.surface ? `${formatNumber(r.surface)} m²` : null],
                ["Pièces", r.rooms ? String(r.rooms) : null],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
              ))}
            </dl>
            {r.message && <p className="border-t border-line p-5 text-sm whitespace-pre-line text-body">« {r.message} »</p>}
            {r.sellerId && <p className="border-t border-line px-5 py-3 text-sm"><Link href={`/app/vendeurs/${r.sellerId}`} className="font-semibold text-brand-700">Fiche prospect vendeur</Link></p>}
          </Card>
          <Card>
            <CardHeader title="Vos biens comparables" description={median ? `Prix médian : ${formatEuros(median)} / m²` : "Même ville et même type de bien"} />
            {list.length === 0 ? (
              <p className="p-5 text-sm text-muted">Aucun bien comparable avec prix et surface dans votre portefeuille.</p>
            ) : (
              <ul className="px-5 py-2">
                {list.slice(0, 8).map((c) => (
                  <li key={c.id} className="flex justify-between gap-3 border-b border-hover py-2.5 text-sm last:border-0">
                    <Link href={`/app/biens/${c.id}`} className="min-w-0 truncate hover:text-brand-700">{c.title}</Link>
                    <span className="flex-none text-muted">{formatEuros(c.perM2)}/m² · {STATUS_LABEL[c.status].label}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

export default function EstimationDetailPage({ params }: PageProps<"/app/estimations/[id]">) {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Detail params={params} />
      </Suspense>
    </div>
  );
}
