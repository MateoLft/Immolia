import Link from "next/link";
import { Suspense } from "react";
import QRCode from "qrcode";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EstimationPageCard } from "@/components/app/estimation-page-card";
import { getAgencySlug, listEstimationRequests } from "@/lib/data";
import { ESTIMATION_STATUS_LABEL, kindLabel } from "@/lib/property-types";
import { siteUrl } from "@/lib/site-url";

export const metadata = { title: "Estimations" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

async function Content() {
  const [slug, requests, base] = await Promise.all([getAgencySlug(), listEstimationRequests(), siteUrl()]);
  const url = slug ? `${base}/estimation/${slug}` : null;
  const qrSvg = url ? await QRCode.toString(url, { type: "svg", margin: 1 }) : null;
  return (
    <>
      <EstimationPageCard url={url} qrSvg={qrSvg} />
      <Card className="overflow-hidden">
        <h2 className="border-b border-line px-5 py-4 text-[17px] font-semibold">Demandes d&apos;estimation</h2>
        {requests.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Aucune demande pour le moment.</p>
        ) : (
          <ul>
            {requests.map((r) => (
              <li key={r.id} className="border-b border-hover last:border-0">
                <Link href={`/app/estimations/${r.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-canvas">
                  <span className="min-w-0">
                    <span className="block font-semibold">{r.fullName} · {kindLabel(r.kind)} à {r.city}</span>
                    <span className="block text-[13px] text-muted">{[r.surface && `${r.surface} m²`, r.rooms && `${r.rooms} pièces`, `reçue le ${dateFmt.format(new Date(r.createdAt))}`].filter(Boolean).join(" · ")}</span>
                  </span>
                  <Badge tone={ESTIMATION_STATUS_LABEL[r.status].tone}>{ESTIMATION_STATUS_LABEL[r.status].label}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

export default function EstimationsPage() {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight">Estimations</h1>
        <p className="mt-1 text-[15px] text-muted">Recevez des demandes d&apos;estimation en ligne et envoyez des avis de valeur professionnels.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Content />
      </Suspense>
    </div>
  );
}
