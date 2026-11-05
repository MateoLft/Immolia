"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  BarChart3,
  Building2,
  CalendarDays,
  FileCheck2,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { MODULES } from "@/lib/modules";
import type { Account } from "@/lib/property-types";
import { PLANS } from "@/lib/plans";
import { signOut } from "@/app/(auth)/actions";

const ICONS: Record<string, LucideIcon> = {
  biens: Building2,
  visites: CalendarDays,
  acquereurs: Users,
  vendeurs: UserRound,
  mandats: FileCheck2,
  estimations: BarChart3,
  dossiers: FolderOpen,
  studio: Sparkles,
  conformite: ShieldCheck,
  equipe: UsersRound,
  parametres: Settings,
};

function NavLink({ href, icon: Icon, label, exact = false }: { href: string; icon: LucideIcon; label: string; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
        active ? "bg-hover font-semibold text-ink" : "font-medium text-body hover:bg-canvas",
      )}
    >
      <Icon aria-hidden className="size-[18px]" strokeWidth={1.8} />
      {label}
    </Link>
  );
}

export function Sidebar({ account }: { account: Account | null }) {
  const trialPct = account ? Math.round(((account.trialDays - account.trialDaysLeft) / account.trialDays) * 100) : 0;
  const onTrial = account?.subscriptionStatus === "trialing";
  const sections = [
    { id: "pilotage", title: null },
    { id: "outils", title: "Outils" },
  ] as const;

  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Referme le menu mobile à chaque changement de page.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <aside className="flex w-full flex-col border-b border-line bg-white px-4 py-4 print:hidden lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:flex-none lg:gap-6 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:py-5">
      <div className="flex items-center justify-between px-2">
        <Logo href="/app" />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="app-menu"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          className="flex size-10 items-center justify-center rounded-lg border border-line-strong lg:hidden"
        >
          {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </div>

      <div id="app-menu" className={clsx("flex-1 flex-col gap-6 pt-5 lg:flex lg:pt-0", open ? "flex" : "hidden")}>
      <nav aria-label="Menu principal" className="flex flex-col gap-6">
        {sections.map((s) => (
          <div key={s.id} className="flex flex-col gap-0.5">
            {s.title && <span className="px-3 pb-1.5 text-xs font-semibold text-subtle">{s.title}</span>}
            {s.id === "pilotage" && <NavLink href="/app" icon={LayoutDashboard} label="Tableau de bord" exact />}
            {MODULES.filter((m) => m.section === s.id).map((m) => (
              <NavLink key={m.slug} href={`/app/${m.slug}`} icon={ICONS[m.slug] ?? Building2} label={m.name} />
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        {account && onTrial && (
          <div className="rounded-[10px] border border-line bg-canvas p-3.5">
            <p className="text-[13px] font-semibold">
              Offre {PLANS[account.plan].name} · {account.trialDaysLeft} jour{account.trialDaysLeft > 1 ? "s" : ""} d&apos;essai restant{account.trialDaysLeft > 1 ? "s" : ""}
            </p>
            <div
              className="mt-2.5 h-1.5 rounded-full bg-line"
              role="progressbar"
              aria-label="Essai gratuit consommé"
              aria-valuenow={trialPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${trialPct}%` }} />
            </div>
            <Link href="/app/parametres" className="mt-2.5 inline-block text-[13px] font-semibold text-brand-700">
              Choisir mon offre
            </Link>
          </div>
        )}
        {account?.demo && (
          <p className="rounded-[10px] bg-warning-50 px-3.5 py-2.5 text-[13px] text-warning-700">Mode démo : données d&apos;exemple.</p>
        )}
        <div className="flex items-center gap-2.5 border-t border-line px-1 pt-4">
          <span className="flex size-9 flex-none items-center justify-center rounded-full bg-brand-50 text-[13px] font-bold text-brand-700">
            {account?.initials ?? ""}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{account?.fullName ?? "\u00a0"}</span>
            <span className="block truncate text-[13px] text-muted">{account?.agencyName ?? "\u00a0"}</span>
          </span>
          <form action={signOut} className="ml-auto">
            <button type="submit" aria-label="Se déconnecter" title="Se déconnecter" className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-ink">
              <LogOut aria-hidden className="size-[18px]" strokeWidth={1.8} />
            </button>
          </form>
        </div>
      </div>
      </div>
    </aside>
  );
}
