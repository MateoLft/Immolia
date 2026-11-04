import type { Visit } from "@/lib/property-types";

const fmt = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export function UpcomingVisits({ visits, showProperty = true }: { visits: Visit[]; showProperty?: boolean }) {
  if (visits.length === 0) {
    return <p className="px-5 py-6 text-sm text-muted">Aucune visite prévue pour le moment.</p>;
  }
  return (
    <ul className="px-5 pt-1 pb-2">
      {visits.map((v) => (
        <li key={v.id} className="flex gap-3.5 border-b border-hover py-3 last:border-0">
          <span className="w-24 flex-none text-[13px] font-semibold text-body first-letter:uppercase">{fmt.format(new Date(v.startsAt))}</span>
          <span aria-hidden className="w-[3px] flex-none rounded bg-brand-600" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{showProperty ? v.propertyTitle : (v.buyerName ?? "Acquéreur à renseigner")}</span>
            <span className={v.voucherSigned ? "block text-[13px] text-success-700" : "block text-[13px] text-muted"}>
              {showProperty ? (v.buyerName ?? "Acquéreur à renseigner") : v.voucherSigned ? "Bon de visite signé" : "Bon de visite à signer"}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
