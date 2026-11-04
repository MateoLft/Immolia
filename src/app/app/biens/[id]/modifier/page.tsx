import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyForm } from "@/components/app/property-form";
import { getProperty } from "@/lib/data";

export const metadata = { title: "Modifier le bien" };

async function EditForm({ params }: { params: PageProps<"/app/biens/[id]/modifier">["params"] }) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return (
    <>
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/biens" className="hover:text-ink">Biens</Link>
        <span aria-hidden>/</span>
        <Link href={`/app/biens/${property.id}`} className="hover:text-ink">{property.title}</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">Modifier</span>
      </nav>
      <h1 className="text-[26px] font-bold tracking-tight">Modifier le bien</h1>
      <PropertyForm property={property} />
    </>
  );
}

export default function EditPropertyPage({ params }: PageProps<"/app/biens/[id]/modifier">) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-7 lg:px-8">
      <Suspense fallback={<><Skeleton className="h-5 w-60" /><Skeleton className="h-96 w-full" /></>}>
        <EditForm params={params} />
      </Suspense>
    </div>
  );
}
