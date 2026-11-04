import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/auth-forms";

export const metadata = { title: "Connexion" };

async function SignInWithNext({ searchParams }: { searchParams: PageProps<"/connexion">["searchParams"] }) {
  const { suite } = await searchParams;
  return <SignInForm next={typeof suite === "string" ? suite : undefined} />;
}

export default function SignInPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <AuthCard
      title="Bon retour parmi nous"
      subtitle="Connectez-vous à votre espace Immolia."
      footer={<>Pas encore de compte ? <Link href="/inscription" className="font-semibold text-brand-700">Démarrer l&apos;essai</Link></>}
    >
      <Suspense fallback={<SignInForm />}>
        <SignInWithNext searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}
