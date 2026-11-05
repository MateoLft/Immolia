import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { StudioWorkspace } from "@/components/app/studio-workspace";
import { getProperty, listGeneratedContents, listPropertyPhotos } from "@/lib/data";
import { MAX_AI_PHOTOS, isAiConfigured } from "@/lib/ai";

export const metadata = { title: "Studio IA" };

async function Workspace({ params }: { params: PageProps<"/app/studio/[id]">["params"] }) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  const [history, photos] = await Promise.all([listGeneratedContents(property.id), listPropertyPhotos(property.id)]);

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/studio" className="hover:text-ink">Studio IA</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">{property.title}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">{property.title}</h1>
          <p className="mt-1 text-[15px] text-muted">{property.city}</p>
        </div>
        <Link href={`/app/biens/${property.id}`} className="text-sm font-semibold text-brand-700">Voir la fiche du bien</Link>
      </div>
      <StudioWorkspace
        propertyId={property.id}
        initialHistory={history}
        aiReady={isAiConfigured()}
        photoCount={photos.length}
        maxPhotos={MAX_AI_PHOTOS}
      />
    </>
  );
}

export default function StudioPropertyPage({ params }: PageProps<"/app/studio/[id]">) {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <Suspense fallback={<><Skeleton className="h-5 w-48" /><Skeleton className="h-8 w-80" /><Skeleton className="h-96 w-full" /></>}>
        <Workspace params={params} />
      </Suspense>
    </div>
  );
}
