import Link from "next/link";
import { Suspense } from "react";
import { PropertyForm } from "@/components/app/property-form";
import { Skeleton } from "@/components/ui/skeleton";
import { listSellers } from "@/lib/data";

export const metadata = { title: "Nouveau bien" };

async function Form() {
  return <PropertyForm sellers={await listSellers()} />;
}

export default function NewPropertyPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-7 lg:px-8">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/biens" className="hover:text-ink">Biens</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">Nouveau bien</span>
      </nav>
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Nouveau bien</h1>
        <p className="mt-1 text-[15px] text-muted">Seuls le titre et la ville sont obligatoires : vous pourrez compléter le reste plus tard.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Form />
      </Suspense>
    </div>
  );
}
