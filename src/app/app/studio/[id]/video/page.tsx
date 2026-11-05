import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoMaker } from "@/components/app/video-maker";
import { getAccount, getProperty, getSettings, listPropertyPhotos } from "@/lib/data";
import { formatEuros, formatNumber, kindLabel } from "@/lib/property-types";

export const metadata = { title: "Vidéo courte" };

async function Maker({ params }: { params: PageProps<"/app/studio/[id]/video">["params"] }) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) notFound();
  const [photos, account, settings] = await Promise.all([listPropertyPhotos(p.id), getAccount(), getSettings()]);
  const subtitle = [kindLabel(p.kind), p.surface ? `${formatNumber(p.surface)} m²` : null, p.city].filter(Boolean).join(" · ");
  const contact = [account.agencyName, settings.phone || settings.agency.phone].filter(Boolean).join(" · ");
  return (
    <>
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/studio" className="hover:text-ink">Studio IA</Link>
        <span aria-hidden>/</span>
        <Link href={`/app/studio/${p.id}`} className="hover:text-ink">{p.title}</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">Vidéo</span>
      </nav>
      <h1 className="text-[26px] font-bold tracking-tight">Vidéo courte</h1>
      <VideoMaker photos={photos.map((ph) => ({ id: ph.id, url: ph.url }))} title={p.title} subtitle={subtitle} price={p.price ? formatEuros(p.price) : null} contact={contact} />
    </>
  );
}

export default function VideoPage({ params }: PageProps<"/app/studio/[id]/video">) {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Maker params={params} />
      </Suspense>
    </div>
  );
}
