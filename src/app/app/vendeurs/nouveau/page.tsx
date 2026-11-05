import Link from "next/link";
import { Suspense } from "react";
import { SellerForm } from "@/components/app/seller-form";

export const metadata = { title: "Nouveau vendeur" };

async function Form({ searchParams }: { searchParams: PageProps<"/app/vendeurs/nouveau">["searchParams"] }) {
  const { prospect } = await searchParams;
  return <SellerForm prospect={prospect === "1"} />;
}

export default function NewSellerPage({ searchParams }: PageProps<"/app/vendeurs/nouveau">) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-7 lg:px-8">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/vendeurs" className="hover:text-ink">Vendeurs</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">Nouveau vendeur</span>
      </nav>
      <h1 className="text-[26px] font-bold tracking-tight">Nouveau vendeur</h1>
      <Suspense>
        <Form searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
