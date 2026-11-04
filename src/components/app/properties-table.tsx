import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PropertyThumb } from "@/components/app/property-thumb";
import { PROPERTIES, STATUS_LABEL, type Property } from "@/lib/mock-data";

const fmt = (n: number | null) => (n === null ? "—" : new Intl.NumberFormat("fr-FR").format(n));

export function PropertiesTable({ properties = PROPERTIES }: { properties?: Property[] }) {
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
                  <PropertyThumb tint={p.tint} className="h-9 w-11" />
                  <span>
                    <span className="block font-semibold">{p.title}</span>
                    <span className="block text-[13px] text-muted">{p.city} · {p.surface} m²</span>
                  </span>
                </Link>
              </td>
              <td className="px-3 py-3.5 text-body tabular-nums">{p.price ? `${fmt(p.price)} €` : "[PRIX]"}</td>
              <td className="px-3 py-3.5"><Badge tone={STATUS_LABEL[p.status].tone} dot>{STATUS_LABEL[p.status].label}</Badge></td>
              <td className="px-3 py-3.5 text-right text-body tabular-nums">{fmt(p.views)}</td>
              <td className="px-3 py-3.5 text-right text-body tabular-nums">{fmt(p.visits)}</td>
              <td className="px-5 py-3.5 text-muted">{p.mandate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
