import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { BuyerForm } from "@/components/app/buyer-form";
import { getBuyer } from "@/lib/data";

export const metadata = { title: "Modifier l'acquéreur" };

async function Edit({ params }: { params: PageProps<"/app/acquereurs/[id]/modifier">["params"] }) {
  const { id } = await params;
  const buyer = await getBuyer(id);
  if (!buyer) notFound();
  return (
    <>
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/acquereurs" className="hover:text-ink">Acquéreurs</Link>
        <span aria-hidden>/</span>
        <Link href={`/app/acquereurs/${buyer.id}`} className="hover:text-ink">{buyer.fullName}</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">Modifier</span>
      </nav>
      <h1 className="text-[26px] font-bold tracking-tight">Modifier l&apos;acquéreur</h1>
      <BuyerForm buyer={buyer} />
    </>
  );
}

export default function EditBuyerPage({ params }: PageProps<"/app/acquereurs/[id]/modifier">) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-7 lg:px-8">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Edit params={params} />
      </Suspense>
    </div>
  );
}
