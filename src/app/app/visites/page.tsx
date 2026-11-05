import Link from "next/link";
import { Suspense } from "react";
import { CalendarPlus, Inbox, Mail, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArchiveRequestButton, CompleteVisitForm, UpcomingVisitActions } from "@/components/app/visit-actions";
import { getAccount, listNewVisitRequests, listVisitsOverview } from "@/lib/data";
import { SendProperty } from "@/components/app/send-property";
import type { Visit } from "@/lib/property-types";

export const metadata = { title: "Visites" };

const TZ = "Europe/Paris";
const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const shortFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ });

function Contact({ phone, email }: { phone?: string | null; email?: string | null }) {
  if (!phone && !email) return null;
  return (
    <span className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
      {phone && <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-1 text-brand-700"><Phone aria-hidden className="size-3.5" />{phone}</a>}
      {email && <a href={`mailto:${email}`} className="flex items-center gap-1 text-brand-700"><Mail aria-hidden className="size-3.5" />{email}</a>}
    </span>
  );
}

function VisitLine({ v, children }: { v: Visit; children?: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-3 border-b border-hover px-5 py-4 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-4">
        <span className="w-14 flex-none pt-0.5 text-sm font-semibold tabular-nums">{timeFmt.format(new Date(v.startsAt))}</span>
        <span className="min-w-0">
          <Link href={`/app/biens/${v.propertyId}`} className="block font-semibold hover:text-brand-700">{v.propertyTitle}</Link>
          <span className="block text-sm text-muted">{v.buyerName ?? "Acquéreur à renseigner"}</span>
          <Contact phone={v.buyerPhone} email={v.buyerEmail} />
        </span>
      </div>
      {children}
    </li>
  );
}

async function Requests() {
  const requests = await listNewVisitRequests();
  if (requests.length === 0) return null;
  return (
    <Card>
      <CardHeader title={`Demandes de visite (${requests.length})`} description="Reçues depuis vos pages publiques" />
      <ul>
        {requests.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 border-b border-hover px-5 py-4 last:border-0 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="font-semibold">{r.fullName} <span className="font-normal text-muted">· {r.propertyTitle}</span></p>
              <p className="text-[13px] text-subtle">Reçue le {shortFmt.format(new Date(r.createdAt))}</p>
              <Contact phone={r.phone} email={r.email} />
              {r.availability && <p className="mt-1.5 text-sm text-body">Disponibilités : {r.availability}</p>}
              {r.message && <p className="mt-1 text-sm whitespace-pre-line text-body">« {r.message} »</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <ButtonLink href={`/app/visites/nouvelle?demande=${r.id}`} size="sm">Planifier</ButtonLink>
              <ArchiveRequestButton id={r.id} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

async function Overview() {
  const [{ upcoming, toComplete, done }, account] = await Promise.all([listVisitsOverview(), getAccount()]);
  const reminder = (v: Visit) =>
    `Bonjour${v.buyerName ? ` ${v.buyerName.split(/\s+/)[0]}` : ""},\n\nJe vous confirme notre visite de « ${v.propertyTitle} » ${dayFmt.format(new Date(v.startsAt))} à ${timeFmt.format(new Date(v.startsAt))}.\n\nÀ bientôt,\n${account.fullName} – ${account.agencyName}`;

  const byDay = new Map<string, Visit[]>();
  for (const v of upcoming) {
    const key = dayFmt.format(new Date(v.startsAt));
    byDay.set(key, [...(byDay.get(key) ?? []), v]);
  }

  return (
    <>
      {toComplete.length > 0 && (
        <Card>
          <CardHeader title={`À compléter (${toComplete.length})`} description="Visites passées : indiquez si elles ont eu lieu et ajoutez un compte rendu" />
          <ul>
            {toComplete.map((v) => (
              <li key={v.id} className="flex flex-col gap-3 border-b border-hover px-5 py-4 last:border-0 lg:flex-row lg:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{v.propertyTitle}</p>
                  <p className="text-sm text-muted first-letter:uppercase">{shortFmt.format(new Date(v.startsAt))} · {v.buyerName ?? "Acquéreur à renseigner"}</p>
                </div>
                <div className="w-full lg:max-w-md"><CompleteVisitForm id={v.id} /></div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader title="À venir" description={upcoming.length === 0 ? undefined : `${upcoming.length} visite${upcoming.length > 1 ? "s" : ""} prévue${upcoming.length > 1 ? "s" : ""}`} />
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <Inbox aria-hidden className="size-8 text-brand-600" strokeWidth={1.6} />
            <p className="font-semibold">Aucune visite prévue</p>
            <p className="max-w-sm text-sm text-muted">Planifiez une visite, ou publiez la page d&apos;un bien : les demandes des acquéreurs arriveront ici.</p>
          </div>
        ) : (
          [...byDay.entries()].map(([day, visits]) => (
            <div key={day}>
              <h3 className="bg-canvas px-5 py-2 text-[13px] font-semibold text-muted first-letter:uppercase">{day}</h3>
              <ul>
                {visits.map((v) => (
                  <VisitLine key={v.id} v={v}>
                    <div className="flex flex-col gap-2 sm:items-end">
                      <UpcomingVisitActions id={v.id} voucherSigned={v.voucherSigned} />
                      <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                        Rappel :
                        <SendProperty email={v.buyerEmail ?? null} phone={v.buyerPhone ?? null} subject={`Confirmation de visite : ${v.propertyTitle}`} message={reminder(v)} />
                      </div>
                    </div>
                  </VisitLine>
                ))}
              </ul>
            </div>
          ))
        )}
      </Card>

      {done.length > 0 && (
        <Card>
          <CardHeader title="Réalisées récemment" />
          <ul>
            {done.map((v) => (
              <li key={v.id} className="border-b border-hover px-5 py-4 last:border-0">
                <p className="font-semibold">{v.propertyTitle} <span className="font-normal text-muted">· {v.buyerName ?? "Acquéreur"}</span></p>
                <p className="text-[13px] text-subtle first-letter:uppercase">{shortFmt.format(new Date(v.startsAt))}{v.voucherSigned ? " · bon de visite signé" : ""}</p>
                {v.feedback && <p className="mt-1.5 text-sm whitespace-pre-line text-body">{v.feedback}</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

export default function VisitsPage() {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Visites</h1>
          <p className="mt-1 text-[15px] text-muted">Agenda, demandes reçues et comptes rendus.</p>
        </div>
        <ButtonLink href="/app/visites/nouvelle"><CalendarPlus aria-hidden className="size-4" />Planifier une visite</ButtonLink>
      </div>
      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <Requests />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Overview />
      </Suspense>
    </div>
  );
}
