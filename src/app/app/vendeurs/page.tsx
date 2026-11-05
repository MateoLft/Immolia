import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { UserPlus, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listProperties, listSellers } from "@/lib/data";
import { parisToday } from "@/lib/paris-time";

export const metadata = { title: "Vendeurs" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });

async function SellersList() {
  await connection(); // la date du jour est calculée à chaque requête
  const [sellers, properties] = await Promise.all([listSellers(), listProperties()]);
  if (sellers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong bg-white px-6 py-14 text-center">
        <UserRound aria-hidden className="size-8 text-brand-600" strokeWidth={1.6} />
        <p className="font-semibold">Aucun vendeur pour le moment</p>
        <p className="max-w-md text-sm text-muted">Ajoutez vos vendeurs et rattachez-les à leurs biens : Immolia prépare chaque semaine leur rapport (vues, visites, retours des visiteurs).</p>
        <ButtonLink href="/app/vendeurs/nouveau"><UserPlus aria-hidden className="size-4" />Ajouter un vendeur</ButtonLink>
      </div>
    );
  }
  const today = parisToday();
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="bg-canvas text-left text-xs text-muted">
              <th scope="col" className="px-5 py-3 font-semibold">Vendeur</th>
              <th scope="col" className="px-3 py-3 font-semibold">Biens</th>
              <th scope="col" className="px-5 py-3 font-semibold">Relance</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => {
              const own = properties.filter((p) => p.sellerId === s.id);
              const due = s.nextContactOn && s.nextContactOn <= today;
              return (
                <tr key={s.id} className="border-t border-line hover:bg-canvas">
                  <td className="px-5 py-3.5">
                    <Link href={`/app/vendeurs/${s.id}`} className="font-semibold hover:text-brand-700">{s.fullName}</Link>
                    {s.isProspect && <Badge tone="brand" className="ml-2">Prospect</Badge>}
                    <span className="block text-[13px] text-muted">{s.phone ?? s.email ?? "Pas de coordonnées"}</span>
                  </td>
                  <td className="px-3 py-3.5 text-body">{own.length === 0 ? <span className="text-muted">—</span> : own.map((p) => p.title).join(", ")}</td>
                  <td className="px-5 py-3.5">
                    {s.nextContactOn ? (
                      <span className={due ? "font-semibold text-warning-700" : "text-body"}>{due ? "À relancer · " : ""}{dateFmt.format(new Date(`${s.nextContactOn}T12:00:00Z`))}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function SellersPage() {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Vendeurs</h1>
          <p className="mt-1 text-[15px] text-muted">Vos vendeurs, vos prospects et leurs rapports hebdomadaires.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink href="/app/vendeurs/nouveau?prospect=1" variant="secondary">Ajouter un prospect</ButtonLink>
          <ButtonLink href="/app/vendeurs/nouveau"><UserPlus aria-hidden className="size-4" />Ajouter un vendeur</ButtonLink>
        </div>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <SellersList />
      </Suspense>
    </div>
  );
}
