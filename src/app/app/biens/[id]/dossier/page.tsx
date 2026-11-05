import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentManager } from "@/components/app/document-manager";
import { getAccount, getProperty, getSeller, listDocuments } from "@/lib/data";
import { DOCUMENT_KINDS, requiredKinds } from "@/lib/documents";
import { isAiConfigured } from "@/lib/ai";

export const metadata = { title: "Dossier de vente" };

async function Dossier({ params }: { params: PageProps<"/app/biens/[id]/dossier">["params"] }) {
  const { id } = await params;
  const p = await getProperty(id);
  if (!p) notFound();
  const [documents, seller, account] = await Promise.all([listDocuments(p.id), p.sellerId ? getSeller(p.sellerId) : Promise.resolve(null), getAccount()]);
  const required = requiredKinds(p.kind, Boolean(p.annualCharges));
  const kinds = [...required, DOCUMENT_KINDS.find((k) => k.value === "autre")!];
  const missing = required.filter((k) => !documents.some((d) => d.kind === k.value));
  const pct = Math.round(((required.length - missing.length) / required.length) * 100);

  const relance = [
    `Bonjour${seller ? ` ${seller.fullName.split(/\s+/)[0]}` : ""},`,
    "",
    `Pour préparer la vente de « ${p.title} », il me manque encore les documents suivants :`,
    ...missing.map((k) => `• ${k.label}`),
    "",
    "Vous pouvez me les envoyer en réponse à ce message. Merci !",
    "",
    account.fullName,
    account.agencyName,
  ].join("\n");

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/biens" className="hover:text-ink">Biens</Link>
        <span aria-hidden>/</span>
        <Link href={`/app/biens/${p.id}`} className="hover:text-ink">{p.title}</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">Dossier de vente</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Dossier de vente</h1>
          <p className="mt-1 text-[15px] text-muted">{required.length - missing.length} pièce{required.length - missing.length > 1 ? "s" : ""} sur {required.length} · {pct} %</p>
        </div>
        {missing.length > 0 && (
          seller?.email ? (
            <a href={`mailto:${seller.email}?subject=${encodeURIComponent(`Documents pour la vente : ${p.title}`)}&body=${encodeURIComponent(relance)}`} className="flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-xs hover:bg-brand-700">
              <Mail aria-hidden className="size-4" />Relancer le vendeur ({missing.length} pièce{missing.length > 1 ? "s" : ""})
            </a>
          ) : (
            <p className="text-sm text-muted">Rattachez un vendeur avec un email au bien pour le relancer en un clic.</p>
          )
        )}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Avancement du dossier" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-success-700" style={{ width: `${pct}%` }} />
      </div>
      <DocumentManager propertyId={p.id} kinds={kinds} documents={documents} aiReady={isAiConfigured()} />
      <p className="text-xs text-subtle">Documents stockés dans un espace privé, accessible uniquement par votre agence. Les synthèses de l&apos;IA sont une aide : vérifiez toujours les documents originaux.</p>
    </>
  );
}

export default function DossierPage({ params }: PageProps<"/app/biens/[id]/dossier">) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-7 lg:px-8">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Dossier params={params} />
      </Suspense>
    </div>
  );
}
