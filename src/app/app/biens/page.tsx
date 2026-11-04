import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PropertiesTable } from "@/components/app/properties-table";
import { PROPERTIES } from "@/lib/mock-data";

export const metadata = { title: "Biens" };

export default function PropertiesPage() {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Biens</h1>
          <p className="mt-1 text-[15px] text-muted">{PROPERTIES.length} biens dans votre portefeuille</p>
        </div>
        <ButtonLink href="/app/biens/nouveau"><Plus aria-hidden className="size-4" strokeWidth={2.4} />Nouveau bien</ButtonLink>
      </div>
      <Card className="overflow-hidden">
        <PropertiesTable />
      </Card>
    </div>
  );
}
