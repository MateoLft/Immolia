import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SellerForm } from "@/components/app/seller-form";
import { getSeller } from "@/lib/data";

export const metadata = { title: "Modifier le vendeur" };

async function Edit({ params }: { params: PageProps<"/app/vendeurs/[id]/modifier">["params"] }) {
  const { id } = await params;
  const seller = await getSeller(id);
  if (!seller) notFound();
  return (
    <>
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/vendeurs" className="hover:text-ink">Vendeurs</Link>
        <span aria-hidden>/</span>
        <Link href={`/app/vendeurs/${seller.id}`} className="hover:text-ink">{seller.fullName}</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">Modifier</span>
      </nav>
      <h1 className="text-[26px] font-bold tracking-tight">Modifier le vendeur</h1>
      <SellerForm seller={seller} />
    </>
  );
}

export default function EditSellerPage({ params }: PageProps<"/app/vendeurs/[id]/modifier">) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-7 lg:px-8">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Edit params={params} />
      </Suspense>
    </div>
  );
}
