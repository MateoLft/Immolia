import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { VisitForm } from "@/components/app/visit-form";
import { getVisitRequest, listBuyers, listProperties } from "@/lib/data";
import { parisToday } from "@/lib/paris-time";

export const metadata = { title: "Planifier une visite" };

async function Form({ searchParams }: { searchParams: PageProps<"/app/visites/nouvelle">["searchParams"] }) {
  const { demande, bien } = await searchParams;
  const [properties, buyers, request] = await Promise.all([
    listProperties(),
    listBuyers(),
    typeof demande === "string" ? getVisitRequest(demande) : Promise.resolve(null),
  ]);
  const notes = request ? [request.availability && `Disponibilités : ${request.availability}`, request.message && `Message : ${request.message}`].filter(Boolean).join("\n") : undefined;

  return (
    <>
      {request && (
        <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Demande de <strong>{request.fullName}</strong> reçue depuis la page publique de « {request.propertyTitle} ».
        </p>
      )}
      {properties.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong bg-white px-6 py-10 text-center text-muted">
          Ajoutez d&apos;abord un bien pour pouvoir planifier une visite. <Link href="/app/biens/nouveau" className="font-semibold text-brand-700">Ajouter un bien</Link>
        </p>
      ) : (
        <VisitForm
          properties={properties.map((p) => ({ id: p.id, title: p.title, city: p.city }))}
          buyers={buyers}
          defaults={{
            date: parisToday(),
            propertyId: request?.propertyId ?? (typeof bien === "string" ? bien : undefined),
            requestId: request?.id,
            buyerName: request?.fullName,
            buyerEmail: request?.email ?? undefined,
            buyerPhone: request?.phone ?? undefined,
            notes,
          }}
        />
      )}
    </>
  );
}

export default function NewVisitPage({ searchParams }: PageProps<"/app/visites/nouvelle">) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-7 lg:px-8">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/visites" className="hover:text-ink">Visites</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">Planifier une visite</span>
      </nav>
      <h1 className="text-[26px] font-bold tracking-tight">Planifier une visite</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
