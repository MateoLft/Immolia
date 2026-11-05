import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PropertyThumb } from "@/components/app/property-thumb";
import { STATUS_LABEL, formatEuros, formatNumber, mandateLabel, tintFor, type Property } from "@/lib/property-types";

export function PropertiesTable({ properties }: { properties: Property[] }) {
  if (properties.length === 0) return <EmptyProperties />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <thead>
          <tr className="bg-canvas text-left text-xs text-muted">
            <th scope="col" className="px-5 py-3 font-semibold">Bien</th>
            <th scope="col" className="px-3 py-3 font-semibold">Prix</th>
            <th scope="col" className="px-3 py-3 font-semibold">Statut</th>
            <th scope="col" className="px-3 py-3 text-right font-semibold">Vues</th>
            <th scope="col" className="px-3 py-3 text-right font-semibold">Visites</th>
            <th scope="col" className="px-5 py-3 font-semibold">Mandat</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => (
            <tr key={p.id} className="border-t border-line hover:bg-canvas">
              <td className="px-5 py-3.5">
                <Link href={`/app/biens/${p.id}`} className="flex items-center gap-3">
                  <PropertyThumb tint={tintFor(p.id)} src={p.coverUrl} className="h-9 w-11" />
                  <span>
                    <span className="block font-semibold">{p.title}</span>
                    <span className="block text-[13px] text-muted">
                      {[p.city, p.surface ? `${formatNumber(p.surface)} m²` : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </Link>
              </td>
              <td className="px-3 py-3.5 text-body tabular-nums">{formatEuros(p.price)}</td>
              <td className="px-3 py-3.5"><Badge tone={STATUS_LABEL[p.status].tone} dot>{STATUS_LABEL[p.status].label}</Badge></td>
              <td className="px-3 py-3.5 text-right text-body tabular-nums">{formatNumber(p.views)}</td>
              <td className="px-3 py-3.5 text-right text-body tabular-nums">{formatNumber(p.visitsCount)}</td>
              <td className="px-5 py-3.5 text-muted">{mandateLabel(p.mandateType)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyProperties() {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-brand-50">
        <Building2 aria-hidden className="size-6 text-brand-700" strokeWidth={1.8} />
      </span>
      <p className="text-base font-semibold">Aucun bien pour le moment</p>
      <p className="max-w-sm text-sm text-muted">Ajoutez votre premier bien : il apparaîtra ici avec son statut, ses vues et ses visites.</p>
      <ButtonLink href="/app/biens/nouveau" className="mt-2"><Plus aria-hidden className="size-4" strokeWidth={2.4} />Ajouter un bien</ButtonLink>
    </div>
  );
}
