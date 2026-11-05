import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SignaturePad } from "@/components/app/signature-pad";
import { getSettings, getVisit } from "@/lib/data";
import { kindLabel } from "@/lib/property-types";

export const metadata = { title: "Bon de visite" };

const fmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

async function Voucher({ params }: { params: PageProps<"/app/visites/[id]/bon">["params"] }) {
  const { id } = await params;
  const [v, settings] = await Promise.all([getVisit(id), getSettings()]);
  if (!v) notFound();
  const a = settings.agency;
  return (
    <>
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/visites" className="hover:text-ink">Visites</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">Bon de visite</span>
      </nav>
      <section className="flex flex-col gap-4 rounded-xl border border-line bg-white p-6 shadow-card">
        <h1 className="text-2xl font-bold tracking-tight">Bon de visite</h1>
        <dl className="grid gap-3 text-[15px] sm:grid-cols-2">
          <div><dt className="text-sm text-muted">Agence</dt><dd className="font-semibold">{a.name}{a.professionalCard ? ` · carte pro n° ${a.professionalCard}` : ""}</dd></div>
          <div><dt className="text-sm text-muted">Agent</dt><dd className="font-semibold">{settings.fullName}</dd></div>
          <div><dt className="text-sm text-muted">Bien visité</dt><dd className="font-semibold">{kindLabel(v.propertyKind)} · {v.propertyTitle}</dd></div>
          <div><dt className="text-sm text-muted">Adresse</dt><dd className="font-semibold">{[v.propertyAddress, v.propertyCity].filter(Boolean).join(", ")}</dd></div>
          <div><dt className="text-sm text-muted">Date de la visite</dt><dd className="font-semibold first-letter:uppercase">{fmt.format(new Date(v.startsAt))}</dd></div>
          <div><dt className="text-sm text-muted">Visiteur</dt><dd className="font-semibold">{v.buyerName ?? "—"}</dd></div>
        </dl>
      </section>
      <section className="rounded-xl border border-line bg-white p-6 shadow-card">
        {v.voucherSigned && v.signaturePath ? (
          <div className="flex flex-col items-start gap-3">
            <p className="flex items-center gap-2 font-semibold text-success-700"><CheckCircle2 aria-hidden className="size-5" />Signé par {v.signerName}</p>
            <a href={`/app/visites/${v.id}/bon.pdf`} target="_blank" rel="noopener" className="flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-brand-700">Télécharger le bon signé (PDF)</a>
          </div>
        ) : (
          <SignaturePad visitId={v.id} defaultName={v.buyerName ?? ""} />
        )}
      </section>
      <p className="text-xs text-subtle">Signature manuscrite sur écran, horodatée. Pour une valeur probante renforcée, une signature électronique certifiée (prestataire agréé) pourra être ajoutée.</p>
    </>
  );
}

export default function VoucherPage({ params }: PageProps<"/app/visites/[id]/bon">) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-7 lg:px-8">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Voucher params={params} />
      </Suspense>
    </div>
  );
}
