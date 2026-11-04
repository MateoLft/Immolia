import Link from "next/link";
import { Bell, Plus, Search, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PropertiesTable } from "@/components/app/properties-table";
import { TodayLabel } from "@/components/app/today-label";
import { AGENDA, CURRENT_USER, TODOS } from "@/lib/mock-data";

export const metadata = { title: "Tableau de bord" };

export default function DashboardPage() {
  const kpis = [
    { label: "Biens actifs", value: "12", delta: "+2", sub: "cette semaine" },
    { label: "Visites (7 jours)", value: "8", delta: "+3", sub: "vs semaine dernière" },
    { label: "Acquéreurs qualifiés", value: "15", delta: "+6", sub: "financement validé" },
    { label: "Mandats signés (mois)", value: "3", delta: "2", sub: "exclusifs" },
  ];

  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Bonjour {CURRENT_USER.firstName}</h1>
          <p className="mt-1 text-[15px] text-muted"><TodayLabel /> · 3 visites et 2 rappels prévus aujourd&apos;hui</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-white px-3 shadow-xs">
            <Search aria-hidden className="size-4 text-subtle" />
            <span className="sr-only">Rechercher</span>
            <input type="search" placeholder="Rechercher" className="w-48 bg-transparent text-sm outline-none placeholder:text-subtle" />
          </label>
          <button type="button" aria-label="Notifications" className="flex size-10 items-center justify-center rounded-lg border border-line-strong bg-white shadow-xs hover:bg-canvas">
            <Bell aria-hidden className="size-[18px] text-body" strokeWidth={1.8} />
          </button>
          <ButtonLink href="/app/biens/nouveau"><Plus aria-hidden className="size-4" strokeWidth={2.4} />Nouveau bien</ButtonLink>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-2 rounded-xl border border-line bg-white p-5 shadow-card">
            <span className="text-sm font-medium text-muted">{k.label}</span>
            <span className="text-[30px] font-bold tracking-tight tabular-nums">{k.value}</span>
            <span className="text-[13px] text-muted"><span className="font-semibold text-success-700">{k.delta}</span> {k.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <CardHeader
            title="Mes biens"
            description="12 biens actifs · 2 en attente de publication"
            action={<Link href="/app/biens" className="text-[13px] font-semibold text-brand-700">Tout voir</Link>}
          />
          <PropertiesTable />
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Agenda du jour" action={<Link href="/app/visites" className="text-[13px] font-semibold text-brand-700">Voir l&apos;agenda</Link>} />
            <ul className="px-5 pt-2 pb-3">
              {AGENDA.map((a) => (
                <li key={a.time} className="flex gap-3.5 border-b border-hover py-3 last:border-0">
                  <span className="w-12 flex-none text-[13px] font-semibold text-body tabular-nums">{a.time}</span>
                  <span aria-hidden className={a.kind === "visite" ? "w-[3px] flex-none rounded bg-brand-600" : "w-[3px] flex-none rounded bg-warning-500"} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{a.title}</span>
                    <span className="block text-[13px] text-muted">{a.who}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader title="Tâches" />
            <div className="flex flex-col gap-3 px-5 py-4">
              {TODOS.map((t) => (
                <label key={t} className="flex items-start gap-2.5 text-sm text-body">
                  <input type="checkbox" className="mt-0.5 size-4 accent-brand-600" />
                  {t}
                </label>
              ))}
            </div>
          </Card>

          <Card className="flex items-start gap-3.5 p-5">
            <span className="flex size-9 flex-none items-center justify-center rounded-lg bg-brand-50">
              <Sparkles aria-hidden className="size-[18px] text-brand-700" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Contenus prêts : Maison · Écully</p>
              <p className="mt-1 mb-2.5 text-[13px] leading-relaxed text-muted">Annonce, 3 posts et une vidéo de 30 s générés par le Studio IA.</p>
              <Link href="/app/studio" className="text-[13px] font-semibold text-brand-700">Relire et publier</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
