import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PLANS, type PlanId } from "@/lib/plans";

/** Écran affiché pour un module prévu mais pas encore développé. */
export function ComingSoon({ title, description, plan }: { title: string; description: string; plan: PlanId }) {
  return (
    <div className="flex flex-col gap-6 px-5 py-7 lg:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-bold tracking-tight">{title}</h1>
        <Badge tone="brand">Offre {PLANS[plan].name}</Badge>
      </div>
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-line-strong bg-white px-6 py-20 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand-50">
          <Clock aria-hidden className="size-6 text-brand-700" strokeWidth={1.8} />
        </span>
        <h2 className="text-lg font-semibold">Module en préparation</h2>
        <p className="max-w-md text-[15px] leading-relaxed text-muted">{description}</p>
        <ButtonLink href="/app" variant="secondary">Retour au tableau de bord</ButtonLink>
      </div>
    </div>
  );
}
