import Link from "next/link";
import { BuyerForm } from "@/components/app/buyer-form";

export const metadata = { title: "Nouvel acquéreur" };

export default function NewBuyerPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-7 lg:px-8">
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/app/acquereurs" className="hover:text-ink">Acquéreurs</Link>
        <span aria-hidden>/</span>
        <span className="font-medium text-ink">Nouvel acquéreur</span>
      </nav>
      <h1 className="text-[26px] font-bold tracking-tight">Nouvel acquéreur</h1>
      <BuyerForm />
    </div>
  );
}
