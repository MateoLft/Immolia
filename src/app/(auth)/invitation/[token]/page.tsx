import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { InvitationForm } from "@/components/auth/auth-forms";
import { Skeleton } from "@/components/ui/skeleton";
import { anonClient } from "@/lib/public-property";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ROLE_LABEL, type MemberRole } from "@/lib/property-types";

export const metadata = { title: "Invitation", robots: { index: false } };

type Inv = { agencyName: string; email: string; role: MemberRole; valid: boolean };

async function Content({ params }: { params: PageProps<"/invitation/[token]">["params"] }) {
  const { token } = await params;
  const inv: Inv | null =
    isSupabaseConfigured && /^[a-f0-9]{32,}$/.test(token) ? ((await anonClient().rpc("get_invitation", { p_token: token })).data as Inv | null) : null;

  if (!inv || !inv.valid) {
    return (
      <AuthCard
        title="Invitation non valable"
        subtitle="Ce lien a expiré, a déjà été utilisé ou a été annulé. Demandez une nouvelle invitation au responsable de votre agence."
        footer={<Link href="/connexion" className="font-semibold text-brand-700">Se connecter</Link>}
      >
        <span />
      </AuthCard>
    );
  }
  return (
    <AuthCard
      title={`Rejoindre ${inv.agencyName}`}
      subtitle={`Vous êtes invité en tant que ${ROLE_LABEL[inv.role].toLowerCase()} sur Immolia.`}
      footer={<>Déjà un compte ? <Link href="/connexion" className="font-semibold text-brand-700">Se connecter</Link></>}
    >
      <InvitationForm token={token} email={inv.email} />
    </AuthCard>
  );
}

export default function InvitationPage({ params }: PageProps<"/invitation/[token]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-5 py-12"><Skeleton className="h-96 w-full" /></div>}>
      <Content params={params} />
    </Suspense>
  );
}
