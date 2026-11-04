import { Suspense } from "react";
import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertiesTable } from "@/components/app/properties-table";
import { listProperties } from "@/lib/data";

export const metadata = { title: "Biens" };

async function PropertiesCount() {
  const n = (await listProperties()).length;
  return <>{n === 0 ? "Aucun bien" : `${n} bien${n > 1 ? "s" : ""}`} dans votre portefeuille</>;
}

async function AllProperties() {
  return <PropertiesTable properties={await listProperties()} />;
}

export default function PropertiesPage() {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Biens</h1>
          <p className="mt-1 text-[15px] text-muted">
            <Suspense fallback={<span className="inline-block h-4 w-40" />}>
              <PropertiesCount />
            </Suspense>
          </p>
        </div>
        <ButtonLink href="/app/biens/nouveau"><Plus aria-hidden className="size-4" strokeWidth={2.4} />Nouveau bien</ButtonLink>
      </div>
      <Card className="overflow-hidden">
        <Suspense
          fallback={
            <div className="flex flex-col gap-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          }
        >
          <AllProperties />
        </Suspense>
      </Card>
    </div>
  );
}
