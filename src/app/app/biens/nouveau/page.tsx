import Link from "next/link";
import { PropertyForm } from "@/components/app/property-form";

export const metadata = { title: "Nouveau bien" };

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
      <PropertyForm />
    </div>
  );
}
