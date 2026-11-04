import Link from "next/link";
import { Suspense } from "react";
import { Plus, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertiesTable } from "@/components/app/properties-table";
import { TodayLabel } from "@/components/app/today-label";
import { UpcomingVisits } from "@/components/app/upcoming-visits";
import { getAccount, getDashboardStats, listProperties, listUpcomingVisits } from "@/lib/data";

export const metadata = { title: "Tableau de bord" };

async function Greeting() {
  const account = await getAccount();
  return <>Bonjour {account.firstName}</>;
}

async function Kpis() {
  const s = await getDashboardStats();
  const kpis = [
    { label: "Biens actifs", value: s.activeProperties, sub: `dont ${s.toPublish} à publier` },
    { label: "Visites (7 prochains jours)", value: s.visitsNext7Days, sub: "visites prévues" },
    { label: "Acquéreurs qualifiés", value: s.qualifiedBuyers, sub: "prioritaires ou qualifiés" },
    { label: "Mandats (ce mois-ci)", value: s.mandatesThisMonth, sub: "nouveaux mandats" },
  ];
  return kpis.map((k) => (
    <div key={k.label} className="flex flex-col gap-2 rounded-xl border border-line bg-white p-5 shadow-card">
      <span className="text-sm font-medium text-muted">{k.label}</span>
      <span className="text-[30px] font-bold tracking-tight tabular-nums">{k.value}</span>
      <span className="text-[13px] text-muted">{k.sub}</span>
    </div>
  ));
}

function KpisSkeleton() {
  return Array.from({ length: 4 }, (_, i) => (
    <div key={i} className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5 shadow-card">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-12" />
      <Skeleton className="h-3 w-24" />
    </div>
  ));
}

async function RecentProperties() {
  const properties = await listProperties({ limit: 6 });
  return <PropertiesTable properties={properties} />;
}

async function Visits() {
  return <UpcomingVisits visits={await listUpcomingVisits({ limit: 5 })} />;
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-5">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">
            <Suspense fallback="Bonjour">
              <Greeting />
            </Suspense>
          </h1>
          <p className="mt-1 text-[15px] text-muted"><TodayLabel /></p>
        </div>
        <ButtonLink href="/app/biens/nouveau"><Plus aria-hidden className="size-4" strokeWidth={2.4} />Nouveau bien</ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Suspense fallback={<KpisSkeleton />}>
          <Kpis />
        </Suspense>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <CardHeader
            title="Mes biens"
            description="Les derniers biens ajoutés"
            action={<Link href="/app/biens" className="text-[13px] font-semibold text-brand-700">Tout voir</Link>}
          />
          <Suspense fallback={<ListSkeleton />}>
            <RecentProperties />
          </Suspense>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Prochaines visites" action={<Link href="/app/visites" className="text-[13px] font-semibold text-brand-700">Voir l&apos;agenda</Link>} />
            <Suspense fallback={<ListSkeleton />}>
              <Visits />
            </Suspense>
          </Card>

          <Card className="flex items-start gap-3.5 p-5">
            <span className="flex size-9 flex-none items-center justify-center rounded-lg bg-brand-50">
              <Sparkles aria-hidden className="size-[18px] text-brand-700" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Bientôt : le Studio IA</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Annonces, posts et vidéos générés automatiquement à partir de vos biens.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
