import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteForm, MemberControls, RevokeInvitationButton } from "@/components/app/team-manager";
import { getAccount, getCurrentUserId, getMemberStats, getSettings, listInvitations, listMembers } from "@/lib/data";
import { PLANS } from "@/lib/plans";
import { ROLE_LABEL } from "@/lib/property-types";

export const metadata = { title: "Équipe" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });

async function Team() {
  const [members, settings, account, me] = await Promise.all([listMembers(), getSettings(), getAccount(), getCurrentUserId()]);
  const canManage = settings.role === "owner" || settings.role === "manager";
  const isOwner = settings.role === "owner";
  const [invitations, stats] = await Promise.all([canManage ? listInvitations() : Promise.resolve([]), canManage ? getMemberStats() : Promise.resolve(new Map())]);
  const active = members.filter((m) => m.active);
  const seats = PLANS.agence.seats;
  const used = active.length + invitations.length;

  return (
    <>
      {canManage && (
        <p className="text-sm text-muted">
          {active.length} membre{active.length > 1 ? "s" : ""} actif{active.length > 1 ? "s" : ""}
          {invitations.length > 0 ? ` et ${invitations.length} invitation${invitations.length > 1 ? "s" : ""} en attente` : ""}
          {" · "}l&apos;offre {PLANS.agence.name} inclut {seats} agents{used > seats ? `, puis ${PLANS.agence.extraSeat} € par agent supplémentaire` : ""}.
          {account.plan !== "agence" && account.subscriptionStatus === "trialing" ? " Pendant l'essai, vous pouvez tester l'équipe librement." : ""}
        </p>
      )}

      {canManage && <InviteForm canInviteManager={isOwner} agencyName={account.agencyName} inviterName={account.fullName} />}

      <Card className="overflow-hidden">
        <CardHeader title="Membres" description={canManage ? "Activité du mois en cours" : undefined} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="bg-canvas text-left text-xs text-muted">
                <th scope="col" className="px-5 py-3 font-semibold">Membre</th>
                <th scope="col" className="px-3 py-3 font-semibold">Rôle</th>
                {canManage && (
                  <>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Biens actifs</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Visites à venir</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Visites réalisées</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Mandats</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Textes IA</th>
                  </>
                )}
                <th scope="col" className="px-5 py-3 font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const st = stats.get(m.id);
                return (
                  <tr key={m.id} className={m.active ? "border-t border-line" : "border-t border-line opacity-60"}>
                    <td className="px-5 py-3.5">
                      <span className="block font-semibold">{m.fullName}{m.id === me ? " (vous)" : ""}</span>
                      <span className="block text-[13px] text-muted">{[m.email, m.phone].filter(Boolean).join(" · ") || "—"}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <Badge tone={m.role === "owner" ? "brand" : "neutral"}>{ROLE_LABEL[m.role]}</Badge>
                      {!m.active && <Badge className="ml-2">Désactivé</Badge>}
                    </td>
                    {canManage && (
                      <>
                        <td className="px-3 py-3.5 text-right tabular-nums">{st?.properties ?? 0}</td>
                        <td className="px-3 py-3.5 text-right tabular-nums">{st?.upcomingVisits ?? 0}</td>
                        <td className="px-3 py-3.5 text-right tabular-nums">{st?.visitsThisMonth ?? 0}</td>
                        <td className="px-3 py-3.5 text-right tabular-nums">{st?.mandatesThisMonth ?? 0}</td>
                        <td className="px-3 py-3.5 text-right tabular-nums">{st?.aiThisMonth ?? 0}</td>
                      </>
                    )}
                    <td className="px-5 py-3.5"><MemberControls member={m} isOwner={isOwner} isSelf={m.id === me} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {canManage && invitations.length > 0 && (
        <Card>
          <CardHeader title="Invitations en attente" />
          <ul className="px-5 py-2">
            {invitations.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-hover py-3 last:border-0">
                <span>
                  <span className="block text-sm font-semibold">{i.email}</span>
                  <span className="block text-[13px] text-muted">{ROLE_LABEL[i.role]} · expire le {dateFmt.format(new Date(i.expiresAt))}</span>
                </span>
                <RevokeInvitationButton invitation={i} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader title="Qui peut faire quoi ?" />
        <ul className="flex flex-col gap-2 p-5 text-sm text-body">
          <li><strong>Responsable</strong> : tout, y compris inviter des managers, changer les rôles et désactiver un accès.</li>
          <li><strong>Manager</strong> : tout le travail de l&apos;agence, invitation d&apos;agents et tableau de bord de l&apos;équipe.</li>
          <li><strong>Agent</strong> : biens, visites, acquéreurs, vendeurs, mandats et Studio IA de l&apos;agence.</li>
        </ul>
        <p className="border-t border-line px-5 py-3 text-[13px] text-muted">Un accès désactivé est coupé immédiatement ; les biens et l&apos;historique du membre restent dans l&apos;agence.</p>
      </Card>
    </>
  );
}

export default function TeamPage() {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Équipe</h1>
        <p className="mt-1 text-[15px] text-muted">Invitez vos agents, attribuez les rôles et suivez l&apos;activité de chacun.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Team />
      </Suspense>
    </div>
  );
}
