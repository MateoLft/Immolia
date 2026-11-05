import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsForm } from "@/components/app/settings-form";
import { getAccount, getSettings } from "@/lib/data";
import { PLANS } from "@/lib/plans";

export const metadata = { title: "Paramètres" };

async function Content() {
  const [settings, account] = await Promise.all([getSettings(), getAccount()]);
  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-5 shadow-card">
        <div>
          <h2 className="text-[17px] font-semibold">Abonnement</h2>
          <p className="mt-0.5 text-sm text-muted">
            Offre {PLANS[account.plan].name}
            {account.subscriptionStatus === "trialing" ? ` · essai gratuit, ${account.trialDaysLeft} jour${account.trialDaysLeft > 1 ? "s" : ""} restant${account.trialDaysLeft > 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <p className="text-sm text-muted">Le paiement en ligne arrive bientôt.</p>
      </section>
      <SettingsForm settings={settings} />
    </>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-7 lg:px-8">
      <h1 className="text-[26px] font-bold tracking-tight">Paramètres</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Content />
      </Suspense>
    </div>
  );
}
