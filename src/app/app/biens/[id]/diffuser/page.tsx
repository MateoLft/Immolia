import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { DiffusionWorkspace } from "@/components/app/diffusion-workspace";
import { getProperty, listGeneratedContents, listListings, listPropertyPhotos } from "@/lib/data";
import { PORTALS, portalFacts, portalText, portalTitle } from "@/lib/portals";

export const metadata = { title: "Diffuser l'annonce" };

async function Workspace({ params }: { params: PageProps<"/app/biens/[id]/diffuser">["params"] }) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) notFound();
  const [contents, listings, photos] = await Promise.all([listGeneratedContents(p.id), listListings(p.id), listPropertyPhotos(p.id)]);

  // Texte de base : celui de la page publique, sinon la dernière annonce du Studio IA.
  const base = p.publicDescription ?? contents.find((c) => c.kind === "annonce")?.content ?? "";
  const portals = PORTALS.map((portal) => ({
    id: portal.id,
    name: portal.name,
    url: portal.url,
    hint: portal.hint,
    titleMax: portal.titleMax,
    textMax: portal.textMax,
    title: portalTitle(p, portal),
    text: base ? portalText(base, p, portal) : "",
    facts: portalFacts(p),
  }));

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/biens" className="hover:text-ink">Biens</Link>
        <span aria-hidden>/</span>
        <Link href={`/app/biens/${p.id}`} className="hover:text-ink">{p.title}</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">Diffuser</span>
      </nav>
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Diffuser l&apos;annonce</h1>
        <p className="mt-1 text-[15px] text-muted">Tout est prêt pour chaque site : copiez, collez, publiez. Indiquez ensuite où l&apos;annonce est en ligne.</p>
      </div>
      <DiffusionWorkspace propertyId={p.id} portals={portals} listings={listings} photoCount={photos.length} />
    </>
  );
}

export default function DiffusePage({ params }: PageProps<"/app/biens/[id]/diffuser">) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-7 lg:px-8">
      <Suspense fallback={<><Skeleton className="h-5 w-60" /><Skeleton className="h-96 w-full" /></>}>
        <Workspace params={params} />
      </Suspense>
    </div>
  );
}
